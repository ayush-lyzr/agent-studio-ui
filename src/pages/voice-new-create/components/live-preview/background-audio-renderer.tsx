import { useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { useTracks } from "@livekit/components-react";

/**
 * Renders background audio tracks published by the agent.
 *
 * The Python agent publishes a separate track named "background_audio".
 * `RoomAudioRenderer` does not automatically play this track, so we attach it
 * to an <audio> element manually.
 */
export function BackgroundAudioRenderer() {
  const audioReference = useRef<HTMLAudioElement | null>(null);
  const tracks = useTracks([Track.Source.Unknown], { onlySubscribed: true });

  const bgTrack = tracks.find(
    (t) => t.publication?.trackName === "background_audio",
  );

  useEffect(() => {
    if (!bgTrack?.publication?.track) {
      if (audioReference.current) {
        audioReference.current.srcObject = null;
      }
      return;
    }

    const track = bgTrack.publication.track;
    let audioElement = audioReference.current;

    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.muted = false;
      // iOS Safari: keep playback inline (property exists on video; attribute is safe for audio).
      audioElement.setAttribute("playsinline", "true");
      audioElement.volume = 1;
      audioReference.current = audioElement;
    }

    track.attach(audioElement);

    const playPromise = audioElement.play();
    if (playPromise?.catch) {
      playPromise.catch((error) => {
        console.warn("[BackgroundAudioRenderer] autoplay blocked:", error);
      });
    }

    return () => {
      track.detach(audioElement!);
    };
  }, [bgTrack?.publication?.track]);

  useEffect(() => {
    return () => {
      if (audioReference.current) {
        audioReference.current.srcObject = null;
        audioReference.current = null;
      }
    };
  }, []);

  return null;
}
