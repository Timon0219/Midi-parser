import styled from "@emotion/styled"
import Pause from "mdi-react/PauseIcon"
import PlayArrow from "mdi-react/PlayArrowIcon"
import { FC } from "react"
import { Localized } from "../../../components/Localized"
import { Tooltip } from "../../../components/Tooltip"
import { CircleButton } from "./CircleButton"

declare global {
  interface Window {
    colors: any
  }
}
export const StyledButton = styled(CircleButton)`
  background: ${window.colors.primary};

  &:hover {
    background: ${window.colors.primary};
    opacity: 0.8;
  }

  &.active {
    background: ${window.colors.primary};
  }
`

export interface PlayButtonProps {
  onClick?: () => void
  isPlaying: boolean
}

export const PlayButton: FC<PlayButtonProps> = (
  { onClick, isPlaying },
  ref,
) => {
  return (
    <Tooltip
      title={
        <>
          <Localized default="Play/Pause">play-pause</Localized> [space]
        </>
      }
      side="top"
    >
      <StyledButton
        id="button-play"
        onClick={onClick}
        className={isPlaying ? "active" : undefined}
      >
        {isPlaying ? <Pause /> : <PlayArrow />}
      </StyledButton>
    </Tooltip>
  )
}
