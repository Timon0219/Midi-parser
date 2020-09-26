import { Measure } from "common/measure/Measure"

export interface BeatWithX {
  measure: number
  beat: number
  x: number
}

// 範囲内の measure を探す。最初の要素は startTick 以前のものも含む
const getMeasuresInRange = (
  measures: Measure[],
  startTick: number,
  endTick: number
) => {
  let i = 0
  const result: Measure[] = []

  for (const measure of measures) {
    const nextMeasure = measures[i + 1]
    i++

    // 最初の measure を探す
    if (result.length === 0) {
      if (nextMeasure !== undefined && nextMeasure.startTick <= startTick) {
        continue // 次の measure が最初になりうる場合はスキップ
      }
      if (measure.startTick > startTick) {
        console.warn("There is no initial time signature. Use 4/4 by default")
        result.push({ startTick: 0, measure: 0, numerator: 4, denominator: 4 })
      } else {
        result.push(measure)
      }
    }

    // 残りの measure を探す. 最初の measure がない場合に正しく処理できるように else ではなくもう一度最初の measure があるか調べる
    if (result.length !== 0) {
      if (measure.startTick <= endTick) {
        result.push(measure)
      } else {
        break
      }
    }
  }

  return result
}

export const createBeatsInRange = (
  allMeasures: Measure[],
  pixelsPerTick: number,
  timeBase: number,
  startTick: number,
  width: number
): BeatWithX[] => {
  const beats: BeatWithX[] = []
  const endTick = startTick + width / pixelsPerTick
  const measures = getMeasuresInRange(allMeasures, startTick, endTick)

  measures.forEach((measure, i) => {
    const nextMeasure = measures[i + 1]

    const ticksPerBeat = (timeBase * 4) / measure.denominator

    // 次の小節か曲の endTick まで拍を作る
    const lastTick = nextMeasure ? nextMeasure.startTick : endTick

    const startBeat = Math.max(
      0,
      Math.floor((startTick - measure.startTick) / ticksPerBeat)
    )
    const endBeat = (lastTick - measure.startTick) / ticksPerBeat

    for (let beat = startBeat; beat < endBeat; beat++) {
      const tick = measure.startTick + ticksPerBeat * beat
      beats.push({
        measure: measure.measure + Math.floor(beat / measure.numerator),
        beat: beat % measure.numerator,
        x: Math.round(tick * pixelsPerTick),
      })
    }
  })

  return beats
}
