const express = require("express");
const bodyParser = require("body-parser");
const textToSpeech = require("@google-cloud/text-to-speech");
const speech = require("@google-cloud/speech");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.json({ limit: "50mb" }));

app.post("/synthesize", async (req, res) => {
  const client = new textToSpeech.TextToSpeechClient();
  const request = {
    input: { text: req.body.text },
    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
  };
  const [response] = await client.synthesizeSpeech(request);
  res.json({ audioContent: response.audioContent.toString("base64") });
});

app.post("/transcribe", async (req, res) => {
  const client = new speech.SpeechClient();
  const audio = {
    content: req.body.audioContent, // Base64-encoded audio content
  };
  const config = {
    encoding: "WEBM_OPUS", // Adjust encoding to match MediaRecorder output
    sampleRateHertz: 48000,
    languageCode: "en-US",
  };
  const request = { audio, config };

  try {
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");
    res.json({ transcription });
  } catch (error) {
    console.error("Error during transcription:", error);
    res.status(500).json({ error: "Transcription failed." });
  }
});
process.env.GOOGLE_APPLICATION_CREDENTIALS =
  process.env.GOOGLE_APPLICATION_CREDENTIALS;
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
