import { SetTempoEvent } from "@signal-app/midifile-ts"
import Color from "color"
import { ISize } from "common/geometry"
import { Beat } from "common/measure"
import Theme from "common/theme/Theme"
import Track, { TrackEvent } from "common/track"
import { TempoCoordTransform } from "common/transform"
import DrawCanvas from "components/DrawCanvas"
import { BAR_WIDTH, HorizontalScrollBar } from "components/inputs/ScrollBar"
import PianoCursor from "components/PianoRoll/PianoCursor"
import PianoGrid from "components/PianoRoll/PianoGrid"
import PianoRuler from "components/PianoRoll/PianoRuler"
import Stage, { StageMouseEvent } from "components/Stage/Stage"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "helpers/bpm"
import mapBeats from "helpers/mapBeats"
import _ from "lodash"
import React, { StatelessComponent } from "react"
import transformEvents from "./transformEvents"

import "./TempoGraph.css"

type DisplayEvent = TrackEvent & SetTempoEvent

interface HorizontalLinesProps {
  width: number
  height: number
  transform: TempoCoordTransform
  borderColor: any
}

function HorizontalLines({
  width,
  height,
  transform,
  borderColor
}: HorizontalLinesProps) {
  if (!width) {
    return null
  }

  function draw(ctx: CanvasRenderingContext2D) {
    const { width, height } = ctx.canvas
    ctx.clearRect(0, 0, width, height)

    ctx.save()
    ctx.translate(0.5, 0.5)

    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1

    // 30 -> 510 を 17 分割した線
    ctx.beginPath()
    for (let i = 30; i < transform.maxBPM; i += 30) {
      const y = Math.round(transform.getY(i))

      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    ctx.stroke()
    ctx.restore()
  }

  return (
    <DrawCanvas
      draw={draw}
      width={width}
      height={height}
      className="HorizontalLines"
      onContextMenu={e => e.preventDefault()}
    />
  )
}

interface GraphAxisProps {
  width: number
  transform: TempoCoordTransform
  offset: number
}

const GraphAxis: StatelessComponent<GraphAxisProps> = ({
  width,
  transform,
  offset
}) => {
  return (
    <div className="GraphAxis" style={{ width }}>
      <div className="values">
        {_.range(30, transform.maxBPM, 30).map(t => {
          const top = Math.round(transform.getY(t)) + offset
          return (
            <div style={{ top }} key={t}>
              {t}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface TempoGraphProps {
  track: Track
  events: TrackEvent[]
  size: ISize
  pixelsPerTick: number
  theme: Theme
  beats: Beat[]
  playerPosition: number
  setPlayerPosition: (tick: number) => void
  endTick: number
  scrollLeft: number
  setScrollLeft: (scroll: number) => void
  changeTempo: (id: number, microsecondsPerBeat: number) => void
  createTempo: (tick: number, microsecondsPerBeat: number) => void
}

export const TempoGraph: StatelessComponent<TempoGraphProps> = ({
  events: sourceEvents,
  size,
  pixelsPerTick,
  theme,
  beats,
  playerPosition,
  setPlayerPosition,
  endTick,
  scrollLeft,
  setScrollLeft,
  changeTempo,
  createTempo
}) => {
  const events = sourceEvents.filter(
    e => (e as any).subtype === "setTempo"
  ) as DisplayEvent[]
  scrollLeft = Math.floor(scrollLeft)

  const { keyWidth, rulerHeight } = theme

  const containerWidth = size.width
  const containerHeight = size.height

  const contentHeight = containerHeight - rulerHeight - BAR_WIDTH
  const transform = new TempoCoordTransform(pixelsPerTick, contentHeight)
  const widthTick = Math.max(endTick, transform.getTicks(containerWidth))
  const contentWidth = widthTick * pixelsPerTick

  const items = transformEvents(
    events,
    transform,
    contentWidth,
    theme.themeColor,
    Color(theme.themeColor)
      .alpha(0.1)
      .string()
  )

  function onMouseDownGraph(e: StageMouseEvent<MouseEvent>) {
    const item = e.items[0]
    if (!item) {
      return
    }

    const event = events.filter(ev => ev.id === item.id)[0]
    const bpm = uSecPerBeatToBPM(event.microsecondsPerBeat)
    const startY = e.nativeEvent.clientY

    function onMouseMove(e: MouseEvent) {
      const delta = transform.getDeltaBPM(e.clientY - startY)
      changeTempo(event.id, bpmToUSecPerBeat(bpm + delta))
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  function onWheelGraph(e: StageMouseEvent<WheelEvent>) {
    const item = e.items[0]
    if (!item) {
      return
    }
    const event = events.filter(ev => ev.id === item.id)[0]
    const movement = e.nativeEvent.deltaY > 0 ? -1 : 1
    const bpm = uSecPerBeatToBPM(event.microsecondsPerBeat)
    changeTempo(event.id, bpmToUSecPerBeat(bpm + movement))
  }

  function onDoubleClickGraph(e: StageMouseEvent<MouseEvent>) {
    const tick = transform.getTicks(e.local.x)
    const bpm = transform.getBPM(e.local.y)
    createTempo(tick, uSecPerBeatToBPM(bpm))
  }

  const startTick = scrollLeft / pixelsPerTick
  const mappedBeats = mapBeats(beats, pixelsPerTick, startTick, widthTick)
  const width = containerWidth - keyWidth

  return (
    <div className="TempoGraph">
      <PianoGrid
        theme={theme}
        width={width}
        height={contentHeight}
        scrollLeft={scrollLeft}
        beats={mappedBeats}
      />
      <HorizontalLines
        width={width}
        height={contentHeight}
        transform={transform}
        borderColor={theme.dividerColor}
      />
      <Stage
        className="Graph"
        items={items}
        width={width}
        height={contentHeight}
        onMouseDown={onMouseDownGraph}
        onDoubleClick={onDoubleClickGraph}
        onWheel={onWheelGraph}
        scrollLeft={scrollLeft}
      />
      <PianoCursor
        width={width}
        height={contentHeight}
        position={transform.getX(playerPosition) - scrollLeft}
      />
      <PianoRuler
        theme={theme}
        width={width}
        height={rulerHeight}
        beats={mappedBeats}
        onMouseDown={({ tick }) => setPlayerPosition(tick)}
        scrollLeft={scrollLeft}
        pixelsPerTick={pixelsPerTick}
      />
      <GraphAxis width={keyWidth} offset={rulerHeight} transform={transform} />
      <HorizontalScrollBar
        scrollOffset={scrollLeft}
        contentLength={contentWidth}
        onScroll={setScrollLeft}
      />
    </div>
  )
}
