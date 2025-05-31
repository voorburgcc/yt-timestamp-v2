document.addEventListener("DOMContentLoaded", () => {
  const timeDisplay = document.getElementById("time-display");
  const copyButton = document.getElementById("copy-time");
  const videoTitleElement = document.createElement("p");
  videoTitleElement.id = "video-title";
  videoTitleElement.textContent = "Loading video title...";
  document.querySelector("h1").after(videoTitleElement); // Add the title under the <h1>

  const notification = document.createElement("p");
  notification.id = "notification";
  notification.style.color = "green";
  notification.style.fontSize = "12px";
  notification.style.marginTop = "10px";
  notification.style.display = "none"; // Initially hidden
  document.body.appendChild(notification);

  // Get the current video title and time
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            // Get YouTube video information
            const video = document.querySelector("video");
            const title = document.querySelector("#container h1 yt-formatted-string")?.textContent?.trim();
            return {
              currentTime: video ? video.currentTime : null,
              title: title || null
            };
          }
        },
        (results) => {
          if (chrome.runtime.lastError || !results || results.length === 0 || results[0].result === null) {
            timeDisplay.textContent = ""; // Clear time display
            videoTitleElement.textContent = "No video detected, try Youtube 😊";
            copyButton.style.display = "none"; // Hide copy button
          } else {
            const { currentTime, title } = results[0].result;
            if (currentTime === null) {
              timeDisplay.textContent = ""; // Clear time display
              videoTitleElement.textContent = "No video detected, try Youtube 😊";
              copyButton.style.display = "none"; // Hide copy button
            } else {
              const formattedTime = new Date(currentTime * 1000).toISOString().substr(11, 8); // HH:MM:SS
              timeDisplay.textContent = formattedTime;
              videoTitleElement.textContent = title || "No title detected";
              copyButton.style.display = "inline-block"; // Show copy button
            }
          }
        }
      );
    }
  });

  copyButton.addEventListener("click", () => {
    const timeText = timeDisplay.textContent;
    if (timeText) {
      navigator.clipboard.writeText(timeText).then(() => {
        notification.textContent = "Timestamp copied to clipboard!";
        notification.style.display = "block";
        setTimeout(() => {
          notification.style.display = "none"; // Hide after 10 seconds
        }, 10000);
      }).catch((err) => {
        console.error("Failed to copy timestamp: ", err);
        notification.textContent = "Failed to copy timestamp.";
        notification.style.display = "block";
        setTimeout(() => {
          notification.style.display = "none"; // Hide after 10 seconds
        }, 10000);
      });
    } else {
      notification.textContent = "No timestamp to copy.";
      notification.style.display = "block";
      setTimeout(() => {
        notification.style.display = "none"; // Hide after 10 seconds
      }, 10000);
    }
  });

  let snapshotCounter = 1; // Counter for snapshot numbering

  document.getElementById("snapshot-frame").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => {
              const video = document.querySelector("video");
              const title = document.querySelector("#container h1 yt-formatted-string")?.textContent?.trim();
              if (!video) {
                return { error: "No video detected" };
              }

              // Create a canvas to capture the current frame
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              // Convert the canvas to a data URL in JPG format
              const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // 0.9 is the quality (90%)

              // Get the current timestamp in HH-MM-SS format
              const currentTime = video.currentTime;
              const formattedTime = new Date(currentTime * 1000).toISOString().substr(11, 8);

              return { dataUrl, title, formattedTime };
            }
          },
          (results) => {
            if (chrome.runtime.lastError || !results || results.length === 0 || results[0].result.error) {
              alert(results[0]?.result?.error || "Failed to capture snapshot");
            } else {
              const { dataUrl, title, formattedTime } = results[0].result;

              // Generate the filename
              const sanitizedTitle = title ? title.replace(/[<>:"/\\|?*]/g, "") : "Untitled";
              const filename = `${snapshotCounter++} Snapshot - ${sanitizedTitle} - ${formattedTime}.jpg`;

              // Create a link to download the image
              const link = document.createElement("a");
              link.href = dataUrl;
              link.download = filename;
              link.click();
            }
          }
        );
      }
    });
  });

  // --- Video Clip Recording and Seek Controls ---

  // Seek helper (1 second)
  function seekVideo(seconds) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (secs) => {
            const video = document.querySelector("video");
            if (video) {
              video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + secs));
            }
          },
          args: [seconds]
        });
      }
    });
  }

  document.getElementById("seek-back").addEventListener("click", () => seekVideo(-1));
  document.getElementById("seek-forward").addEventListener("click", () => seekVideo(1));

  // Record Clip logic
  document.getElementById("record-clip").addEventListener("click", () => {
    const durationInput = document.getElementById("clip-duration");
    let duration = parseInt(durationInput.value, 10);
    if (isNaN(duration) || duration < 1) duration = 10;
    if (duration > 60) duration = 60;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: (clipDuration) => {
              return new Promise(async (resolve, reject) => {
                const video = document.querySelector("video");
                const title = document.querySelector("#container h1 yt-formatted-string")?.textContent?.trim();
                if (!video) {
                  resolve({ error: "No video detected" });
                  return;
                }
                const startTime = video.currentTime;
                if (video.paused) await video.play();
                let stream;
                try {
                  stream = video.captureStream();
                } catch (e) {
                  resolve({ error: "Unable to capture video stream" });
                  return;
                }
                // MediaRecorder only supports webm in browsers, not mp4!
                const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
                let chunks = [];
                recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                  const blob = new Blob(chunks, { type: "video/webm" });
                  const url = URL.createObjectURL(blob);
                  resolve({
                    url,
                    title,
                    start: startTime,
                    end: video.currentTime,
                    duration: video.currentTime - startTime
                  });
                };
                recorder.start();
                video.play();
                setTimeout(() => {
                  recorder.stop();
                  video.pause();
                }, clipDuration * 1000);
              });
            },
            args: [duration],
            world: "MAIN"
          },
          async (results) => {
            if (
              chrome.runtime.lastError ||
              !results ||
              results.length === 0 ||
              results[0].result?.error
            ) {
              alert(results[0]?.result?.error || "Failed to record clip");
            } else {
              const { url, title, start, end, duration } = results[0].result;
              const sanitizedTitle = title ? title.replace(/[<>:"/\\|?*]/g, "") : "Untitled";
              const startStr = new Date(start * 1000).toISOString().substr(11, 8);
              const endStr = new Date(end * 1000).toISOString().substr(11, 8);

              // Download the webm blob for conversion
              const response = await fetch(url);
              const webmBlob = await response.blob();

              // Try to convert to mp4 using ffmpeg.wasm
              let mp4Blob = null;
              let conversionSuccess = false;
              try {
                // Dynamically load ffmpeg.wasm if not already loaded
                if (!window.ffmpeg) {
                  window.ffmpeg = window.ffmpeg || FFmpeg.createFFmpeg({ log: false });
                  if (!window.ffmpeg.isLoaded()) {
                    await window.ffmpeg.load();
                  }
                }
                const ffmpeg = window.ffmpeg;
                const webmArrayBuffer = await webmBlob.arrayBuffer();
                ffmpeg.FS('writeFile', 'input.webm', new Uint8Array(webmArrayBuffer));
                await ffmpeg.run('-i', 'input.webm', '-c:v', 'copy', '-c:a', 'aac', 'output.mp4');
                const mp4Data = ffmpeg.FS('readFile', 'output.mp4');
                mp4Blob = new Blob([mp4Data.buffer], { type: 'video/mp4' });
                conversionSuccess = true;
              } catch (e) {
                console.error("MP4 conversion failed:", e);
                conversionSuccess = false;
              }

              let filename, blobToSave, mimeType;
              if (conversionSuccess && mp4Blob) {
                filename = `Clip - ${sanitizedTitle} - ${startStr}_to_${endStr}.mp4`;
                blobToSave = mp4Blob;
                mimeType = 'video/mp4';
              } else {
                filename = `Clip - ${sanitizedTitle} - ${startStr}_to_${endStr}.webm`;
                blobToSave = webmBlob;
                mimeType = 'video/webm';
              }

              // Save the file
              const blobUrl = URL.createObjectURL(blobToSave);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
                URL.revokeObjectURL(url);
              }, 1000);

              // Notify user
              const notification = document.getElementById("notification");
              if (notification) {
                if (conversionSuccess) {
                  notification.textContent = "Clip saved as MP4!";
                } else {
                  notification.textContent = "Clip saved as WebM (MP4 conversion failed). Use an online converter if you need MP4.";
                }
                notification.style.display = "block";
                setTimeout(() => {
                  notification.style.display = "none";
                }, 10000);
              }
            }
          }
        );
      }
    });
  });
});
