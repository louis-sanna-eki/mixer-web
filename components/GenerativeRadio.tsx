/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/sVmjea8V0iW
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
"use client";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function GenerativeRadio() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Generative Radio</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 space-y-8">
        <Config
          selectedTopics={selectedTopics}
          setSelectedTopics={setSelectedTopics}
        />
        <AudioPlayer topics={selectedTopics} />
      </div>
    </div>
  );
}

function Config({
  selectedTopics,
  setSelectedTopics,
}: {
  selectedTopics: string[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const handleButtonClick = (topic: string) => {
    setSelectedTopics((prevTopics) => {
      if (prevTopics.includes(topic)) {
        return prevTopics.filter((t) => t !== topic);
      } else {
        return [...prevTopics, topic];
      }
    });
  };

  const isSelected = (topic: string) => selectedTopics.includes(topic);

  return (
    <div className="max-w-md w-full space-y-4">
      <h2 className="text-3xl font-bold"> Select Your Favorite Topics</h2>
      <div className="grid grid-cols-3 gap-4">
        {["AI", "Sport", "Tech"].map((topic) => (
          <Button
            key={topic}
            className={`px-6 py-3 rounded-lg ${
              isSelected(topic) ? "opacity-100" : "opacity-50"
            }`}
            variant="outline"
            onClick={() => handleButtonClick(topic)}
          >
            <span className="text-lg font-semibold">{topic}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default Config;

const FLY_URL = "https://mistralai-hackathon.fly.dev:5000/";
// @ts-ignore
const VM_URL = "http://185.157.247.62:5000/";

function AudioPlayer({ topics }: { topics: string[] }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const { toast } = useToast();

  const audioQueue = useRef<Blob[]>([]);
  const isStreaming = useRef<boolean>(false);

  // const {
  //   error,
  //   interimResult,
  //   isRecording,
  //   results,
  //   startSpeechToText,
  //   stopSpeechToText,
  // } = useSpeechToText({
  //   continuous: true,
  //   useLegacyResults: false,
  // });

  // const songIndex = (results as any).findLastIndex(
  //   ({ transcript }: { transcript: string }) =>
  //     transcript.toLocaleLowerCase().includes("spotify")
  // );
  // const newsIndex = (results as any).findLastIndex(
  //   ({ transcript }: { transcript: string }) =>
  //     transcript.toLocaleLowerCase().includes("news")
  // );
  // const hasSpotify = songIndex >= 0 && songIndex >= newsIndex;
  // const hasNews = newsIndex >= 0 && newsIndex > songIndex;
  const [hasSpotify, setHasSpotify] = useState(false);
  const [hasNews, setHasNews] = useState(false);
  const stopStream = useRef(false)
  if (hasNews || hasSpotify) {
    stopStream.current = true;
  }

  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === "S" || event.key === "s") {
        setHasSpotify(true);
        setHasNews(false);
        console.log('The "S" key was pressed!');
      }
      if (event.key === "N" || event.key === "n") {
        setHasSpotify(false);
        setHasNews(true);
        console.log('The "N" key was pressed!');
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  useEffect(() => {
    const socket: any = io("http://185.157.247.62:5000/"); // Replace with your actual server URL

    const playNextAudio = () => {
      if (stopStream.current) {
        audioQueue.current = [];
        return;
      }
      if (audioQueue.current.length > 0 && !isStreaming.current) {
        const audioBlob = audioQueue.current.shift();
        if (audioBlob) {
          isStreaming.current = true;
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.playbackRate = 0.95;

          audio.onended = () => {
            isStreaming.current = false;
            URL.revokeObjectURL(audioUrl); // Clean up the object URL
            setTimeout(() => playNextAudio(), 1);
          };

          // Create an audio context
          // @ts-ignore
          const audioContext = new (window.AudioContext ||
            // @ts-ignore
            window.webkitAudioContext)();
          const source = audioContext.createMediaElementSource(audio);

          // Create a gain node for volume control
          const gainNode = audioContext.createGain();
          gainNode.gain.value = hasSpotify || hasNews ? 0 : 10; // Increase the gain to make the audio louder (1 is normal volume, increase for louder)

          // Create a low-pass filter
          const lowpassFilter = audioContext.createBiquadFilter();
          lowpassFilter.type = "lowpass";
          lowpassFilter.frequency.value = 50000; // Adjust the cutoff frequency as needed

          // Connect the nodes: source -> gainNode -> lowpassFilter -> destination
          source.connect(gainNode);
          gainNode.connect(lowpassFilter);
          lowpassFilter.connect(audioContext.destination);

          audio.play().catch((error) => {
            console.error("Error playing audio:", error);
            isStreaming.current = false; // Ensure playback state is reset
            playNextAudio(); // Attempt to play the next audio in the queue
          });
        }
      }
    };

    socket.on("audio_stream", function (data: any) {
      const audioChunk = data.audio; // This is a base64-encoded string
      console.log("Received audioChunk:", audioChunk);

      // Validate the base64 string
      const isValidBase64 = (str: string) => {
        try {
          return btoa(atob(str)) === str;
        } catch (err) {
          return false;
        }
      };

      if (!isValidBase64(audioChunk)) {
        console.error("Invalid base64 audio data:", audioChunk);
        return;
      }

      try {
        // Convert base64 string to a Blob
        const binaryString = atob(audioChunk);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);

        for (let i = 0; i < binaryLen; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBlob = new Blob([bytes], { type: "audio/wav" });
        audioQueue.current.push(audioBlob);
        playNextAudio(); // Attempt to play the next audio in the queue if possible
      } catch (error) {
        console.error("Error decoding base64 audio data:", error);
      }
    });

    return () => {
      socket.off("audio_stream");
      socket.disconnect();
    };
  }, [hasNews, hasSpotify]);

  const togglePlayPause = () => {
    if (audioRef.current === null) return;
    if (isPlaying) {
      // (audioRef.current as any).pause();
    } else {
      // startSpeechToText();
      postQuery(
        `Create a radio report ${
          topics.length ? "about " + topics.join(", ") : ""
        }.`
      );
      // (audioRef.current as any).play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) {
      setIsDisliked(false); // Ensure dislike is turned off when like is toggled
    }
  };

  const toggleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) {
      setIsLiked(false); // Ensure like is turned off when dislike is toggled
    }
  };

  return (
    <div className="max-w-md w-full space-y-4">
      {hasSpotify ? <audio src="/song.mp3" autoPlay /> : null}
      {hasNews ? <audio src="/news.mp3" autoPlay /> : null}
      <audio ref={audioRef} src="/sad-guitar-melody.wav" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            alt="Album Cover"
            className="rounded-lg"
            height={64}
            src="/gen-radio.png"
            style={{
              aspectRatio: "64/64",
              objectFit: "cover",
            }}
            width={64}
          />
          <div>
            <h3 className="text-xl font-bold">Your Channel</h3>
            <p className="text-gray-400">Just for you, in real time</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            size="icon"
            variant="ghost"
            // onClick={toggleLike}
            onClick={() => {
              if (!isLiked) {
                toast({
                  title: "We love you too 😍 !",
                });
              }
              toggleLike();
            }}
          >
            <HeartIcon className={`w-6 h-6 ${isLiked ? "text-red-500" : ""}`} />
            <span className="sr-only">Like</span>
          </Button>
          <Button size="icon" variant="ghost" onClick={toggleDislike}>
            <ThumbsDownIcon
              className={`w-6 h-6 ${isDisliked ? "text-blue-500" : ""}`}
            />
            <span className="sr-only">Dislike</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center w-full">
        <Button size="icon" variant="ghost" onClick={togglePlayPause}>
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6" />
          )}
          <span className="sr-only">Play/Pause</span>
        </Button>
      </div>
    </div>
  );
}

async function postQuery(query: string) {
  const url = "http://185.157.247.62:5000/ai-radio";
  const data = { query: query };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error:", errorData);
    } else {
      const responseData = await response.json();
      console.log("Success:", responseData);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

function HeartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function PlayIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function PauseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function ThumbsDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

import useSpeechToText from "react-hook-speech-to-text";
import { tree } from "next/dist/build/templates/app-page";
