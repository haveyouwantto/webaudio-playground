# WebAudio Playground

## <a href=https://haveyouwantto.github.io/webaudio-playground/>Open in Github Pages</a>

Webaudio Playground is a browser application that allows users to control the Web Audio API through an interactive flowchart.

With Webaudio Playground, users can create, manipulate, and playback audio in the browser without having to write a single line of code. The interactive flowchart interface makes it easy to connect and arrange different audio nodes, allowing users to create complex audio processing pipelines with ease.

Webaudio Playground also includes a wide range of built-in audio nodes for tasks such as filtering, modulation, and spatialization. Additionally, users can import their own audio files and use them as inputs in their processing pipelines.

Whether you're a professional audio engineer, a music producer, or just someone who enjoys experimenting with sound, Webaudio Playground offers a fun and intuitive way to create and manipulate audio in the browser. Give it a try today!

![FM Modulation](img/fm-modulation.png)

<center>FM Modulation with WebAudio API</center>

-----

## Adding Nodes Using Context Menu

In Webaudio Playground, you can now add nodes to the flowchart using the context menu. Right-click on an empty area of the flowchart canvas to open the context menu, then select the desired node to add it to the canvas.

The following table lists the available nodes and their descriptions:

| Node | Description |
| ---- | ----------- |
| Constant | Provides a constant value as an input to the audio processing pipeline. |
| Oscillator | Generates a periodic waveform, such as a sine, square, or sawtooth wave. |
| Noise Generator | Generates a random noise signal with a flat spectrum, useful for adding background noise or creating percussive sounds. |
| Gain | Amplifies or attenuates the volume of an audio signal. |
| Dynamics Compressor | Compresses the dynamic range of an audio signal, reducing the volume of loud sounds and increasing the volume of quiet sounds. |
| Delay | Adds a delay effect to an audio signal, causing the sound to delay for a certain time. |
| Biquad Filter | Applies a biquad filter to an audio signal, allowing users to apply common filter effects such as low-pass, high-pass, and band-pass filtering. |
| Panner | Controls the spatialization of an audio signal, allowing users to position the sound in 3D space. |
| Stereo Panner | Similar to the Panner node, but specifically designed for stereo audio signals. |
| Audio Source | Imports an audio file from the user's local storage and provides it as an input to the audio processing pipeline. |
| Audio Input | Captures audio from the user's microphone and provides it as an input to the audio processing pipeline. |
| Audio Recorder | Records the output of the audio processing pipeline and saves it to a file on the user's local storage. |
| Waves Viewer | Displays a graphical representation of the audio waveform at the current point in the processing pipeline. |
| Frequency Viewer | Displays a spectral analysis of the audio signal, showing the distribution of energy across different frequencies. |
| Spectrum Viewer | Displays a spectrogram of the audio signal, providing a visual representation of its frequency content. |
| Absolute Value | Calculates the absolute value of an audio signal, ensuring that the resulting values are positive. |

To add a node, simply right-click on an empty area of the flowchart, select the desired node from the context menu, and it will be added to the canvas.

Enjoy exploring and creating unique audio experiences with Webaudio Playground!