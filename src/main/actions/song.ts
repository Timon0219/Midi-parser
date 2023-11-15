import { isNotNull } from "../../common/helpers/array"
import { downloadSongAsMidi } from "../../common/midi/midiConversion"
import Song, { emptySong } from "../../common/song"
import { emptyTrack, isNoteEvent } from "../../common/track"
import { clampNoteNumber } from "../../common/transform/NotePoint"
import RootStore from "../stores/RootStore"

export const setSong = (rootStore: RootStore) => (song: Song) => {
  const { trackMute, pianoRollStore, player, historyStore } = rootStore
  rootStore.song = song
  trackMute.reset()

  pianoRollStore.setScrollLeftInPixels(0)
  pianoRollStore.notGhostTracks = new Set()
  pianoRollStore.showTrackList = true
  pianoRollStore.selection = null
  pianoRollStore.selectedNoteIds = []
  pianoRollStore.selectedTrackId = Math.min(song.tracks.length - 1, 1)

  historyStore.clear()

  player.stop()
  player.reset()
  player.position = 0
}

export const createSong = (rootStore: RootStore) => () => {
  const store = rootStore
  setSong(store)(emptySong())
}

export const saveSong = (rootStore: RootStore) => () => {
  const { song } = rootStore
  song.isSaved = true
  downloadSongAsMidi(song)
}

export const addTrack =
  ({ song, pushHistory }: RootStore) =>
  () => {
    pushHistory()
    song.addTrack(emptyTrack(song.tracks.length - 1))
  }

export const removeTrack =
  ({ song, pianoRollStore, pushHistory }: RootStore) =>
  (trackId: number) => {
    if (song.tracks.filter((t) => !t.isConductorTrack).length <= 1) {
      // conductor track
      // For the last track except for Conductor Track
      // I can not delete it because there is an error when there is no track
      return
    }
    pushHistory()
    song.removeTrack(trackId)
    pianoRollStore.selectedTrackId = Math.min(trackId, song.tracks.length - 1)
  }

export const transposeNotes =
  ({ song }: RootStore) =>
  (
    deltaPitch: number,
    selectedEventIds: {
      [key: number]: number[] // trackId: eventId
    },
  ) => {
    for (const trackIdStr in selectedEventIds) {
      const trackId = parseInt(trackIdStr)
      const eventIds = selectedEventIds[trackId]
      const track = song.getTrack(trackId)
      if (track === undefined) {
        continue
      }
      track.updateEvents(
        eventIds
          .map((id) => {
            const n = track.getEventById(id)
            if (n == undefined || !isNoteEvent(n)) {
              return null
            }
            return {
              id,
              noteNumber: clampNoteNumber(n.noteNumber + deltaPitch),
            }
          })
          .filter(isNotNull),
      )
    }
  }
