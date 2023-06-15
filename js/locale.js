let defaultLocale = {
    "view.ConstantSourceView": "Constant",
    "view.OscillatorNodeView": "Oscillator",
    "view.NoiseGeneratorView": "Noise Generator",
    "view.GainNodeView": "Gain",
    "view.DynamicsCompressorNodeView": "Dynamics Compressor",
    "view.DelayNodeView": "Delay",
    "view.BiquadFilterNodeView": "Biquad Filter",
    "view.ConvolverNodeView": "Convolver",
    "view.AbsoluteValueView": "Absolute Value",
    "view.PannerNodeView": "Panner",
    "view.StereoPannerNodeView": "Stereo Panner",
    "view.AudioSourceView": "Audio File",
    "view.AudioInputNodeView": "Microphone",
    "view.AudioRecorderView": "Audio Recorder",
    "view.AudioOutputNodeView": "Audio Output",
    "view.WavesView": "Waves Viewer",
    "view.FrequencyView": "Frequency Viewer",
    "view.SpectrumView": "Waterfall",
    "view.SpectrumViewV2": "Spectrum Display",
    "view.ChannelSplitterNodeView": "Channel Splitter",
    "view.ChannelMergerNodeView": "Channel Merger",
    "view.WelcomeView": "Welcome",
    "view.ControlsView": "Controls",
    "view.BitcrusherNodeView":"Bit Crusher",
    "view.ConditionalNodeView": "Conditional Routing",

    "category.Generators": "Generators",
    "category.Processors": "Processors",
    "category.Spatialization": "Spatialization",
    "category.AudioIO": "Audio I/O",
    "category.ChannelOperators": "Channel Operators",
    "category.Visualizers": "Visualizers",

    "setting.Node": "Node",
    "setting.Value": "Value",
    "setting.Frequency": "Frequency",
    "setting.Detune": "Detune",
    "setting.Waveform": "Waveform",
    "setting.Gain": "Gain",
    "setting.Attack": "Attack",
    "setting.Release": "Release",
    "setting.Knee": "Knee",
    "setting.Ratio": "Ratio",
    "setting.Delay Time": "Delay Time",
    "setting.Q": "Q",
    "setting.Type": "Type",
    "setting.Position X": "Position X",
    "setting.Position Y": "Position Y",
    "setting.Position Z": "Position Z",
    "setting.Orientation X": "Orientation X",
    "setting.Orientation Y": "Orientation Y",
    "setting.Orientation Z": "Orientation Z",
    "setting.Pan": "Pan",
    "setting.Play Directly": "Play Directly",
    "setting.Input": "Input",
    "setting.Output": "Output",
    "setting.L": "Left",
    "setting.R": "Right",
    "setting.SL": "Surround Left",
    "setting.SR": "Surround Right",
    "setting.C": "Center",
    "setting.LFE": "Low Frequency",
    "setting.BitDepth":"Bit Depth",
    "setting.Threshold":"Threshold",
    "setting.IfGreater":"If Greater",
    "setting.IfLesser":"If Lesser",

    "operation.save": "Save",
    "operation.load": "Load",
    "operation.clear-all": "Clear All",

    "control.impulse": "Impulse",
    "control.frequency": "Frequency",
    "control.record": "Record",
    "control.record-stop": "Stop Recording",

    "text.welcome": `
    <p>This is an browser audio playground where you can experiment and explore with Web Audio API. The Web Audio API allows you to create, manipulate, and process audio in real-time using JavaScript.</p>
    <p>To get started, you can create your own audio flowchart using the context menu. You can create audio nodes, connect them together, apply effects, and more. The audio flowchart will execute in real-time.</p>
    <p>If you're new to the Web Audio API, don't worry! We have some resources to help you get started:</p>
    <ul>
      <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API" target="_blank">Web Audio API Documentation</a>: Official documentation provided by Mozilla Developer Network (MDN) that explains and provides examples on how to use the Web Audio API.</li>
      <li><a href="https://www.html5rocks.com/en/tutorials/webaudio/intro/" target="_blank">Web Audio API Tutorial</a>: A beginner-friendly tutorial on HTML5 Rocks that introduces the Web Audio API, covering the basics and providing code examples.</li>
    </ul>
    <p>Feel free to explore and enjoy the fun of audio coding!</p>
  `,
    "text.controls": `
  <ul>
      <li>To add a node, right-click anywhere on the workspace and select the desired node type from the context menu.</li>
      <li>To connect nodes, drag the red output circle of one node to the blue input circle of another node.</li>
      <li>To disconnect nodes, double-click on an existing connection.</li>
      <li>To delete a panel and its nodes, double-click on the title bar of the panel you wish to delete.</li>
      <li>To move a panel, click and drag its title bar to a new position on the workspace.</li>
    </ul>`,
    "text.controls-touch": `<ul>
    <li>To add a node, long-press anywhere on the workspace to open the context menu, then select the desired node type.</li>
    <li>To connect nodes, tap the output circle of one node to activate an outline, then tap the input circle of another node to connect them.</li>
    <li>To disconnect nodes, double-tap on an existing connection.</li>
    <li>To delete a panel and its nodes, double-tap on the title bar of the panel you wish to delete.</li>
    <li>To move a panel, tap the arrow icon on the right side of the panel's title bar to activate an outline. Then, tap on a new position to set the panel's position on the workspace.</li>
  </ul>`
};

let currentLocale = {};

const localeList = {
    "en-US": "English",
    "zh-CN": "\u7b80\u4f53\u4e2d\u6587",
    "zh-TW": "\u7e41\u9ad4\u4e2d\u6587",
    "ja-JP": "\u65e5\u672c\u8a9e"
};

async function localeInit() {
    let lang = navigator.language;

    if (lang !== 'en-US') {
        try {
            const response = await fetch(`lang/${lang}.json`);
            currentLocale = await response.json();
        } catch (err) {
            currentLocale = defaultLocale;
        } finally {
            updateHTML();
        }
    } else {
        currentLocale = defaultLocale;
        updateHTML();
    }
}

function getLocale(key) {
    let value = currentLocale[key];
    if (value === undefined) {
        value = defaultLocale[key];
        if (value === undefined) {
            value = key;
        }
    }
    return value;
}

function setLocale(language = 'en-US') {
    if (language == 'en-US') {
        currentLocale = defaultLocale;
        updateHTML();
    }
    else {
        fetch("lang/" + language + ".json").then(r => {
            if (r.ok) {
                r.json().then(json => {
                    currentLocale = json;
                    updateHTML();
                })
            }
        })
    }
}

function createLocaleItem(key) {
    let locale = document.createElement('locale');
    locale.setAttribute('key', key);
    locale.innerText = getLocale(key);
    return locale;
}

function createLocaleHTMLItem(key) {
    let locale = document.createElement('locale-html');
    locale.setAttribute('key', key);
    locale.innerHTML = getLocale(key);
    return locale;
}

function updateHTML() {
    document.querySelectorAll("locale").forEach(element => {
        element.innerText = getLocale(element.getAttribute('key'));
    });
    document.querySelectorAll("locale-html").forEach(element => {
        element.innerHTML = getLocale(element.getAttribute('key'));
    });
}


localeInit();