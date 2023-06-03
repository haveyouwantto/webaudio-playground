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
    "view.AudioInputNodeView": "Audio Input",
    "view.AudioRecorderView": "Audio Recorder",
    "view.AudioOutputNodeView": "Audio Output",
    "view.WavesView": "Waves Viewer",
    "view.FrequencyView": "Frequency Viewer",
    "view.SpectrumView": "Waterfall",

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

    "operation.save":"Save",
    "operation.load":"Load",

    "control.impulse":"Impulse",
    "control.frequency":"Frequency",
    "control.record":"Record",
    "control.record-stop": "Stop Recording"
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

function updateHTML() {
    document.querySelectorAll("locale").forEach(element => {
        element.innerText = getLocale(element.getAttribute('key'));
    });
}


localeInit();