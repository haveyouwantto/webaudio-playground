window.AudioContext = window.AudioContext || window.webkitAudioContext;
const isMobile = 'ontouchstart' in document.documentElement;
const dpr = window.devicePixelRatio;
let ctx = new AudioContext();

if (ctx.audioWorklet)
    ctx.audioWorklet.addModule('js/modules.js').then(() => {
        let lastNodes = window.localStorage.getItem('lastNodes');
        if (lastNodes) {
            load(JSON.parse(lastNodes));
        }
    });

let settings = {};
let nodes = new Set();

let selectedOutput = null;
let selectedPanel = null;

let html = document.documentElement;

function drawLine(x1, y1, x2, y2) {
    var svgns = "http://www.w3.org/2000/svg";
    let line = document.createElementNS(svgns, "line");
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#404040');
    line.setAttribute('stroke-width', 2);
    document.querySelector('#lines').appendChild(line);
    return line;
}


let palette = [[0, 0, 0], [75, 0, 159], [104, 0, 251], [131, 0, 255], [155, 18, 157], [175, 37, 0], [191, 59, 0], [206, 88, 0], [223, 132, 0], [240, 188, 0], [255, 252, 0]];
let palette2 = [[75, 0, 159], [104, 0, 251], [131, 0, 255], [155, 18, 157], [175, 37, 0], [191, 59, 0], [206, 88, 0], [223, 132, 0], [240, 188, 0], [255, 252, 0]];

let channelPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

function add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

function mul(v1, mul) {
    return [v1[0] * mul, v1[1] * mul, v1[2] * mul];
}

function colorTrans(pal, prog) {
    if (prog < 0) return formatColor(pal[0]);
    else if (prog >= 1) return formatColor(pal[pal.length - 1]);
    let i = parseInt(prog * (pal.length - 1));
    let v1 = pal[i];
    let v2 = pal[i + 1];

    try {
        let delta = sub(v2, v1);
        let percent = (prog / (1 / (pal.length - 1)));
        let int = parseInt(percent);
        percent -= int;
        let adv = mul(delta, percent);
        let result = add(v1, adv);
        return formatColor(result);
    } catch (error) {
        // console.log(i, v1, v2);
        // console.error(error);
    }
}

function formatColor(v) {
    return `rgb(${v[0]},${v[1]},${v[2]})`;
}

function generateUUID() {
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function roundDownToPowerOfTwo(number) {
    if (number <= 0) {
        return 0;
    }

    let power = Math.floor(Math.log2(number));
    return Math.pow(2, power);
}

class FullScreen {
    constructor() {
        this.element = document.getElementById('fullscreen');
        this.node = null;
    }

    setFullscreen(e) {
        console.log(1);

        this.element.style.display = 'block';
        console.log(this.element);

        console.log(2);

        this.element.appendChild(e);
        e.classList.add('maximized');

        this.node = e;

        if (isMobile) this.followScreen();
    }

    exitFullscreen() {
        this.element.style.display = 'none';
        this.node.classList.remove('maximized');
        return this.node
    }

    setPos(x, y, scale) {
        this.element.style.top = x + 'px';
        this.element.style.left = y + 'px';
        this.element.style.width = (scale * 100) + 'vw';
        this.element.style.height = (scale * 100) + 'vh';
    }

    followScreen() {
        let pos = window.visualViewport;
        fs.setPos(pos.offsetTop, pos.offsetLeft, 1 / pos.scale);
    }
}

let fs = new FullScreen();

class AudioNodeView {
    constructor(x = 8, y = 8, removeable = true) {
        this.x = x;
        this.y = y;
        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        this.dragX = x;
        this.dragY = y;

        this.moveTo(x, y);

        this.innerDiv = document.createElement('div');
        this.innerDiv.className = 'panel-title';
        this.innerDiv.setAttribute('draggable', true);
        this.innerDiv.addEventListener('dragstart', e => {
            let pos = this.panel.getBoundingClientRect();
            this.dragX = e.pageX - pos.x;
            this.dragY = e.pageY - pos.y;
        });
        this.innerDiv.addEventListener('dragend', e => {
            this.moveTo(e.pageX - this.dragX + window.scrollX, e.pageY - this.dragY + window.scrollY)
        });
        if (removeable) this.innerDiv.addEventListener('dblclick', e => {
            this.remove();
        });
        this.innerDiv.appendChild(createLocaleItem('view.' + this.constructor.name));
        if (isMobile) {
            let moveBtn = document.createElement('span');
            moveBtn.style.float = 'right';
            moveBtn.innerText = '\u2195';
            moveBtn.addEventListener('click', e => {
                if (selectedPanel) selectedPanel.panel.classList.remove('selected');
                selectedPanel = this;
                this.panel.classList.add('selected');
                e.stopPropagation();
            });
            this.innerDiv.appendChild(moveBtn);
        }
        // this.setTitle('Audio Node');
        this.panel.appendChild(this.innerDiv);

        document.querySelector('#workspace').appendChild(this.panel);
        nodes.add(this)

        this.settings = {};
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
        this.panel.style.left = x + 'px';
        this.panel.style.top = y + 'px';
        for (const setting in this.settings) {
            const element = this.settings[setting];
            element.updateLines();
        }
    }

    remove() {
        for (const e in this.settings) {
            if (Object.hasOwnProperty.call(this.settings, e)) {
                const element = this.settings[e];
                element.disconnectAll();
                delete settings[element.id]
            }
        }
        document.querySelector('#workspace').removeChild(this.panel);
        nodes.delete(this);
    }

    setTitle(title) {
        this.innerDiv.innerText = title;
    }

    /**
     * 
     * @param {string} name Name of the setting
     * @param {string} type Data type 
     * @param {*} value Default value
     * @param {AudioNode} input Input node
     * @param {AudioParam} valChange Value changer
     * @param {AudioNode} output Output node
     */
    addNewSetting(name, type, value, input = null, valChange = input, output = null) {
        let setting = new Setting(name, type, value, input, valChange, output);
        this.settings[name] = setting;
        this.panel.appendChild(setting.div);
    }

    removeSetting(name) {
        let setting = this.settings[name];
        if (setting) {
            setting.destroy();
            this.panel.removeChild(setting.div);
            delete this.settings[name]
            return true;
        }
        return false;
    }

    getSetting(name) {
        return this.settings[name];
    }
}

class Setting {
    constructor(name, type, value, input = null, valChange = input, output = null) {
        this.div = document.createElement('div');
        this.div.className = 'setting';
        this.id = generateUUID();
        this.inputs = [];
        this.outputs = [];
        this.outputLines = {};
        this.name = name;
        this.type = type;
        this.valChange = valChange;

        this.inputTag;
        this.outputTag;

        if (input) {
            let inputTag = document.createElement('div');
            inputTag.className = 'input';
            this.div.appendChild(inputTag);
            inputTag.addEventListener('drop', e => {
                let node = settings[e.dataTransfer.getData('node')];
                node.connect(this);
            });
            inputTag.addEventListener('dragover', e => {
                e.preventDefault();
            });
            inputTag.addEventListener('dblclick', e => {
                this.disconnectIn();
            });
            if (isMobile) {
                inputTag.addEventListener('click', e => {
                    if (selectedOutput) {
                        selectedOutput.connect(this);
                        selectedOutput.outputTag.classList.remove('selected');
                        selectedOutput = null;
                    }
                });
            }
            this.inputTag = inputTag;
        }

        let text = document.createElement('span');
        text.classList.add('settingText');
        text.appendChild(createLocaleItem('setting.' + name));
        this.div.appendChild(text);
        let field;
        switch (type) {
            case 'num':
                field = document.createElement('input');
                field.type = 'number';
                field.className = 'input-number';
                field.value = value;
                field.step = 0.1;
                field.addEventListener('change', e => {
                    valChange.value = field.value;
                });
                this.div.appendChild(field);
                break;
            case 'list':
                field = document.createElement('select');
                field.className = 'input-number';
                for (const key in value) {
                    if (Object.hasOwnProperty.call(value, key)) {
                        const element = value[key];
                        let option = document.createElement('option');
                        option.value = element;
                        option.appendChild(document.createTextNode(element));
                        field.appendChild(option);
                    }
                }
                field.addEventListener('change', e => {
                    valChange['type'] = field.value;
                });
                this.div.appendChild(field);
                break
            case 'checkbox':
                field = document.createElement('input');
                field.type = 'checkbox';
                field.checked = value;
                field.addEventListener('change', e => {
                    valChange(e.target.checked);
                });
                valChange(value);
                this.div.appendChild(field);
                break
        }
        this.field = field;

        if (output) {
            let outputTag = document.createElement('div');
            outputTag.className = 'output';
            this.div.appendChild(outputTag);
            outputTag.setAttribute('draggable', true);
            outputTag.addEventListener('dragstart', e => {
                e.dataTransfer.setData('node', this.id);
            });
            outputTag.addEventListener('dblclick', e => {
                this.disconnectOut();
            });
            if (isMobile) outputTag.addEventListener('click', e => {
                if (selectedOutput)
                    selectedOutput.outputTag.classList.remove('selected');
                selectedOutput = this;
                outputTag.classList.add('selected');
            });
            this.outputTag = outputTag;
        }

        this.input = input;
        this.output = output;
        settings[this.id] = this;
    }

    getValue() {
        switch (this.type) {
            case 'num':
                return this.valChange.value;
            case 'list':
                return this.valChange.type;
            case 'checkbox':
                return this.field.checked;
        }
    }

    edit(newValue) {
        this.field.value = newValue;
        switch (this.type) {
            case 'num':
                this.valChange.value = newValue;
                return;
            case 'list':
                this.valChange.type = newValue;
                return;
            case 'checkbox':
                this.field.checked = newValue;
                this.valChange(newValue);
        }
    }

    connect(node) {
        console.log(this.outputs.includes(node));

        if (!this.outputs.includes(node)) {
            this.outputs.push(node);
            node.inputs.push(this);
            this.output.connect(node.input);

            let pos1 = this.outputTag.getBoundingClientRect();
            let pos2 = node.inputTag.getBoundingClientRect();
            this.outputLines[node.id] = drawLine(
                pos1.x + pos1.width / 2 + window.scrollX,
                pos1.y + pos1.height / 2 + window.scrollY,
                pos2.x + pos2.width / 2 + window.scrollX,
                pos2.y + pos2.height / 2 + window.scrollY
            );
            console.log(`Connected ${this.output.constructor.name} to ${node.input.constructor.name}`);
            try {
                this.output.start();
            } catch (e) {
                console.warn(e);
            }
        }
    }

    disconnect(node) {
        // console.log(this,node);

        this.outputs = this.outputs.filter(item => item !== node);
        node.inputs = node.inputs.filter(item => item !== this);

        this.output.disconnect(node.input);
        document.querySelector('#lines').removeChild(this.outputLines[node.id]);
        delete this.outputLines[node.id];
        console.log(`Disconnected ${this.output.constructor.name} from ${node.input.constructor.name}`);
    }

    destroy() {
        this.disconnectAll();
        try {
            this.output.stop();
        } catch (e) {
            console.warn(e);
        }
    }

    updateLines(stop = false) {
        for (let node of this.outputs) {
            try {
                let e = this.outputLines[node];
                let pos1 = this.outputTag.getBoundingClientRect();
                let pos2 = node.inputTag.getBoundingClientRect();
                this.outputLines[node.id].setAttribute('x1', pos1.x + pos1.width / 2 + window.scrollX);
                this.outputLines[node.id].setAttribute('y1', pos1.y + pos1.height / 2 + window.scrollY);
                this.outputLines[node.id].setAttribute('x2', pos2.x + pos2.width / 2 + window.scrollX);
                this.outputLines[node.id].setAttribute('y2', pos2.y + pos2.height / 2 + window.scrollY);
            } catch (error) {
                console.warn(error);
            }
        }
        if (!stop) {
            for (let node of this.inputs) {
                node.updateLines(true);
            }
        }
    }

    disconnectAll() {
        this.disconnectIn();
        this.disconnectOut();
    }

    disconnectIn() {
        let e;
        while (e = this.inputs.pop()) {
            try {
                e.disconnect(this);
            } catch (error) {
                console.warn(error);
            }
        }

    }

    disconnectOut() {
        let e;
        while (e = this.outputs.pop()) {
            try {
                this.disconnect(e);
            } catch (error) {
                console.warn(error);
            }
        }
    }
}

class AudioOutputNodeView extends AudioNodeView {
    constructor() {
        super(8, 8, false);
        // this.setTitle('Audio Output');
        this.addNewSetting('Node', '', null, ctx.destination);
    }
}

class OscillatorNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createOscillator();
        this.addNewSetting('Frequency', 'num', this.node.frequency.value, this.node.frequency, this.node.frequency);
        this.addNewSetting('Detune', 'num', this.node.detune.value, this.node.detune, this.node.detune);
        this.addNewSetting('Waveform', 'list', ['sine', 'square', 'sawtooth', 'triangle'], null, this.node);
        this.addNewSetting('Node', '', null, null, null, this.node);
    }
}

class GainNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createGain();
        this.addNewSetting('Gain', 'num', this.node.gain.value, this.node.gain);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class DynamicsCompressorNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createDynamicsCompressor();
        this.addNewSetting('Attack', 'num', this.node.attack.value, this.node.attack);
        this.addNewSetting('Release', 'num', this.node.release.value, this.node.release);
        this.addNewSetting('Knee', 'num', this.node.knee.value, this.node.knee);
        this.addNewSetting('Ratio', 'num', this.node.ratio.value, this.node.ratio);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class PannerNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createPanner();
        this.addNewSetting('Position X', 'num', this.node.positionX.value, this.node.positionX);
        this.addNewSetting('Position Y', 'num', this.node.positionY.value, this.node.positionY);
        this.addNewSetting('Position Z', 'num', this.node.positionZ.value, this.node.positionZ);
        this.addNewSetting('Orientation X', 'num', this.node.orientationX.value, this.node.orientationX);
        this.addNewSetting('Orientation Y', 'num', this.node.orientationY.value, this.node.orientationY);
        this.addNewSetting('Orientation Z', 'num', this.node.orientationZ.value, this.node.orientationZ);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class AudioSourceView extends AudioNodeView {
    constructor() {
        super();
        this.buffer = null;
        this.uploadBtn();
    }

    uploadBtn() {
        let input = document.createElement('input');
        let aud = document.createElement('audio');
        aud.controls = true;
        aud.preload = true;
        this.panel.appendChild(aud);
        let node = ctx.createMediaElementSource(aud);

        input.type = 'file';
        input.accept = 'audio/*, video/*';
        input.addEventListener('change', e => {
            if (input.files[0]) {
                let url = URL.createObjectURL(e.currentTarget.files[0]);
                aud.src = url;
            }
        });
        this.panel.appendChild(input);


        // this.net = document.createElement('button');
        // this.net.innerText = 'URL';
        // this.net.addEventListener('click', e => {
        //     let url = prompt("Enter audio url: ");
        //     if (url) {
        //         aud.src = url;
        //     }
        // });
        // this.panel.appendChild(this.net);

        this.addNewSetting('Node', '', null, null, null, node);
    }
}

class AudioRecorderView extends AudioNodeView {
    constructor() {
        super();
        this.rec = document.createElement('button');
        this.rec.textContent = getLocale('control.record');
        this.dest = ctx.createMediaStreamDestination();

        let audio = document.createElement('audio');
        audio.controls = true;


        let recordedOutput = ctx.createMediaElementSource(audio);

        let clicked = false;
        let mediaRecorder;
        this.rec.addEventListener("click", e => {
            if (!clicked) {
                audio.src = '';
                this.rec.textContent = getLocale('control.record-stop');
                mediaRecorder = this.record();
            } else {
                this.rec.textContent = getLocale('control.record');
                mediaRecorder.stop();
            }
            clicked = !clicked;
        });
        this.addNewSetting('Node', '', null, this.dest, null, recordedOutput);
        this.addNewSetting('Play Directly', 'checkbox', true, null, checked => {
            if (checked) {
                recordedOutput.connect(ctx.destination);
            } else {
                recordedOutput.disconnect(ctx.destination);
            }
        });

        this.panel.appendChild(this.rec);
        this.panel.appendChild(audio);

        this.record();
    }

    record() {
        var chunks = [];
        let mediaRecorder = new MediaRecorder(this.dest.stream, { /*'mimeType': "video/webm;codecs=pcm" }*/ });

        mediaRecorder.ondataavailable = function (evt) {
            chunks.push(evt.data);
        };

        let panel = this.panel;

        mediaRecorder.onstop = function (evt) {
            let aud = panel.querySelector("audio");
            aud.src = URL.createObjectURL(new Blob(chunks, { 'mimeType': "video/webm;codecs=opus"/*'type': "video/webm;codecs=pcm"*/ }));
            aud.onloadedmetadata = function () {
                if (aud.duration === Infinity) {
                    aud.currentTime = 1e101;
                    aud.ontimeupdate = function () {
                        this.ontimeupdate = () => {
                            return;
                        }
                        aud.currentTime = 0.1;
                    }
                }
            }
        };
        mediaRecorder.start();
        return mediaRecorder;
    }
}

class DelayNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createDelay();
        this.addNewSetting('Delay Time', 'num', this.node.delayTime.value, this.node.delayTime);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class StereoPannerNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createStereoPanner();
        this.addNewSetting('Pan', 'num', this.node.pan.value, this.node.pan);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class BiquadFilterNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createBiquadFilter();
        this.addNewSetting('Frequency', 'num', this.node.frequency.value, this.node.frequency);
        this.addNewSetting('Detune', 'num', this.node.detune.value, this.node.detune);
        this.addNewSetting('Q', 'num', this.node.Q.value, this.node.Q);
        this.addNewSetting('Gain', 'num', this.node.gain.value, this.node.gain);
        this.addNewSetting('Type', 'list', ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'], null, this.node);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class WaveShaperNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createWaveShaper();
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class WavesView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createAnalyser();
        this.canvas = document.createElement('canvas');
        this.canvasContainer = document.createElement('div');
        this.canvas.addEventListener('mousedown', e => {
            // alert(e.layerX / this.canvas.width * ctx.sampleRate / 2 + " Hz");
            this.maximized = !this.maximized;
            this.setMaximized(this.maximized);
        });
        this.canvasContainer.appendChild(this.canvas);
        this.panel.appendChild(this.canvasContainer);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
        this.update();

        this.animationId = null;
    }

    update() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        let buffer = new Float32Array(this.canvas.width * 2);
        let canvas = this.canvas;
        let node = this.node;
        let canvasCtx = this.canvas.getContext('2d');
        let draw = () => {
            this.animationId = requestAnimationFrame(draw);
            node.getFloatTimeDomainData(buffer);
            canvasCtx.fillStyle = 'rgb(240, 240, 240)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            canvasCtx.lineWidth = 1;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            canvasCtx.beginPath();

            var sliceWidth = canvas.width / buffer.length;
            var x = 0;

            for (var i = 0; i < buffer.length; i++) {
                var v = -buffer[i] * canvas.height / 2;
                var y = canvas.height / 2 + v;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasCtx.stroke();
        };
        this.animationId = requestAnimationFrame(draw);
    }

    setMaximized(value) {
        if (value) {
            fs.setFullscreen(this.canvas);
            this.canvas.width = window.visualViewport.width * window.visualViewport.scale * dpr;
            this.canvas.height = window.visualViewport.height * window.visualViewport.scale * dpr;
        } else {
            this.canvasContainer.appendChild(fs.exitFullscreen());
            this.canvas.width = 300;
            this.canvas.height = 150;
        }
    }
}

class FrequencyView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createAnalyser();
        this.canvas = document.createElement('canvas');
        this.panel.appendChild(this.canvas);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
        this.update();
        this.canvas.addEventListener('mousedown', e => {
            alert(e.layerX / this.canvas.width * ctx.sampleRate / 2 + " Hz");
        });
    }

    update() {
        let buffer = new Uint8Array(this.node.frequencyBinCount);
        let canvas = this.canvas;
        let node = this.node;
        let canvasCtx = this.canvas.getContext('2d');
        function draw() {
            requestAnimationFrame(draw);
            node.getByteFrequencyData(buffer);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = buffer.length / canvas.width;
            let posX = 0;
            for (let i = 0; i < buffer.length; i += barWidth) {
                let barHeight = buffer[parseInt(i)] / 255 * canvas.height;
                if (barHeight < 0) barHeight = 0;
                canvasCtx.fillStyle = colorTrans(palette2, barHeight / canvas.height);
                canvasCtx.fillRect(posX, canvas.height - barHeight, 1, barHeight);
                posX++;
            }
        };
        draw();
    }
}

class SpectrumView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createAnalyser();
        this.node.smoothingTimeConstant = 0;
        this.canvas = document.createElement('canvas');
        this.panel.appendChild(this.canvas);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
        this.update();
        this.canvas.addEventListener('mousedown', e => {
            alert(e.layerX / this.canvas.width * ctx.sampleRate / 2 + " Hz");
        });
    }

    update() {
        let buffer = new Uint8Array(this.node.frequencyBinCount);
        let canvas = this.canvas;
        let node = this.node;
        let canvasCtx = this.canvas.getContext('2d');
        let y = 0;
        let canvas2 = document.createElement('canvas');

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        function draw() {
            requestAnimationFrame(draw);
            node.getByteFrequencyData(buffer);

            canvas2.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height);

            const barWidth = buffer.length / canvas.width;
            let posX = 0;
            for (let i = 0; i < buffer.length; i += barWidth) {
                let barHeight = buffer[parseInt(i)] / 255 * canvas.height;
                if (barHeight < 0) barHeight = 0;
                canvasCtx.fillStyle = colorTrans(palette, barHeight / canvas.height);
                canvasCtx.fillRect(posX, y % canvas.height, 1, 1);
                posX++;
            }
            canvasCtx.drawImage(canvas2, 0, 1, canvas.width, canvas.height);
        };
        draw();
    }
}

class NoiseGeneratorView extends AudioNodeView {
    constructor() {
        super();
        this.node = new AudioWorkletNode(ctx, 'white-noise');
        this.addNewSetting('Node', '', null, null, null, this.node);
    }
}

class AbsoluteValueView extends AudioNodeView {
    constructor() {
        super();
        this.node = new AudioWorkletNode(ctx, "absolute-value");
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class AudioInputNodeView extends AudioNodeView {
    constructor() {
        super();
        navigator.mediaDevices.getUserMedia({ audio: { sampleRate: ctx.sampleRate }, video: false }).then(stream => {
            this.node = ctx.createMediaStreamSource(stream);
            this.addNewSetting('Node', '', null, null, null, this.node);
        });
    }
}


class ConstantSourceView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createConstantSource();
        this.addNewSetting('Value', 'num', this.node.offset.value, this.node.offset);
        this.addNewSetting('Node', '', null, null, null, this.node);
    }
}


class ConvolverNodeView extends AudioNodeView {
    constructor() {
        super();
        this.buffer = null;
        this.initCanvas();
        this.uploadBtn();
        this.drawMode = 0; // 0 = Impulse, 1 = Frequency
        this.frequencyResponse = null;
    }

    updateGraph() {
        this.clearCanvas();
        try {
            switch (this.drawMode) {
                case 0:
                    for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
                        this.drawImpulse(channel);
                    }
                    break;
                case 1:
                    this.drawLines();
                    for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
                        this.drawFrequency(channel);
                    }
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    }

    clearCanvas() {
        let canvasCtx = this.canvas.getContext('2d');
        canvasCtx.fillStyle = 'rgb(240, 240, 240)';
        canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLines() {
        let middle = this.canvas.height * 0.5;
        let step = this.canvas.height / 16;

        let canvasCtx = this.canvas.getContext('2d');
        canvasCtx.strokeStyle = 'rgba(240, 0, 0, 0.5)';
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, middle);
        canvasCtx.lineTo(this.canvas.width, middle);
        canvasCtx.stroke();

        canvasCtx.strokeStyle = 'rgba(80, 80, 80, 0.7)';
        for (let y = middle + step; y < this.canvas.height; y += step) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, y);
            canvasCtx.lineTo(this.canvas.width, y);
            canvasCtx.stroke();
        }

        for (let y = middle - step; y > 0; y -= step) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, y);
            canvasCtx.lineTo(this.canvas.width, y);
            canvasCtx.stroke();
        }

        let nyquist = ctx.sampleRate / 2;
        for (let i = 4000; i < nyquist; i += 4000) {
            let x = i / nyquist * this.canvas.width;
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, 0);
            canvasCtx.lineTo(x, this.canvas.height);
            canvasCtx.stroke();
        }
    }

    drawImpulse(channel) {
        let buffer = this.buffer.getChannelData(channel);
        let canvasCtx = this.canvas.getContext('2d');
        canvasCtx.fillStyle = 'rgb(240, 240, 240)';
        canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = channelPalette[channel % channelPalette.length];
        canvasCtx.beginPath();

        var sliceWidth = this.canvas.width / buffer.length;

        for (var i = 0; i < buffer.length; i++) {
            var x = i * sliceWidth;
            var v = -buffer[i] * this.canvas.height / 2;
            var y = this.canvas.height / 2 + v;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }

        canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        canvasCtx.stroke();
    }

    drawFrequency(channel) {
        let buffer = this.buffer.getChannelData(channel);

        let a = performance.now();
        let frequencyResponse;
        if (this.frequencyResponse == null) {
            this.frequencyResponse = {}
            frequencyResponse = halfFFT(fft(fftPreprocess([...buffer]))).map(e => 20 * Math.log10(e.modulus));
            this.frequencyResponse[channel] = frequencyResponse;
        } else if (this.frequencyResponse[channel] == null) {
            frequencyResponse = halfFFT(fft(fftPreprocess([...buffer]))).map(e => 20 * Math.log10(e.modulus));
            this.frequencyResponse[channel] = frequencyResponse;
        }
        frequencyResponse = resampleArray(this.frequencyResponse[channel], this.canvas.width);

        console.log(performance.now() - a);


        let canvasCtx = this.canvas.getContext('2d');
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();

        canvasCtx.strokeStyle = channelPalette[channel % channelPalette.length];
        let middle = this.canvas.height * 0.5;
        let step = this.canvas.height / 160;
        console.log(step);


        for (var i = 0; i < this.canvas.width; i++) {
            var y = -(frequencyResponse[i]) * step + middle;

            if (i === 0) {
                canvasCtx.moveTo(i, y);
            } else {
                canvasCtx.lineTo(i, y);
            }
        }
        canvasCtx.stroke();



    }


    uploadBtn() {
        let input = document.createElement('input');
        let node = ctx.createConvolver();

        input.type = 'file';
        input.accept = 'audio/*, video/*';
        input.style.display = 'block';
        input.addEventListener('change', e => {
            if (input.files[0]) {
                var file = input.files[0];
                var reader = new FileReader();
                reader.onload = loadEvent => {
                    var fileBuffer = loadEvent.target.result;
                    ctx.decodeAudioData(fileBuffer).then(buffer => {
                        node.buffer = buffer;
                        this.buffer = buffer;
                        this.frequencyResponse = null;
                        this.updateGraph();
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        });
        this.panel.appendChild(input);

        this.addNewSetting('Node', '', null, node, null, node);
    }

    initCanvas() {
        this.canvasContainer = document.createElement('div');
        this.canvas = document.createElement('canvas');
        this.canvasContainer.appendChild(this.canvas);
        this.panel.appendChild(this.canvasContainer);

        let div = document.createElement('div');

        let i = document.createElement('button');
        i.appendChild(createLocaleItem('control.impulse'));
        i.addEventListener('click', e => {
            this.drawMode = 0;
            this.updateGraph();
        })
        div.appendChild(i);

        let f = document.createElement('button');
        f.appendChild(createLocaleItem('control.frequency'));
        f.addEventListener('click', e => {
            this.drawMode = 1;
            this.updateGraph();
        })
        div.appendChild(f);

        this.maximized = false;
        this.canvas.addEventListener('mousedown', e => {
            // alert(e.layerX / this.canvas.width * ctx.sampleRate / 2 + " Hz");
            this.maximized = !this.maximized;
            this.setMaximized(this.maximized);
        });

        this.panel.appendChild(div);
    }

    setMaximized(value) {
        if (value) {
            fs.setFullscreen(this.canvas);
            this.canvas.width = window.visualViewport.width * window.visualViewport.scale * dpr;
            this.canvas.height = window.visualViewport.height * window.visualViewport.scale * dpr;
        } else {
            this.canvasContainer.appendChild(fs.exitFullscreen());
            this.canvas.width = 300;
            this.canvas.height = 150;
        }
        this.updateGraph();
    }
}


class SpectrumViewV2 extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createAnalyser();
        this.node2 = ctx.createAnalyser();
        this.node.smoothingTimeConstant = 0;
        this.node.connect(this.node2);
        this.node.fftSize = roundDownToPowerOfTwo(ctx.sampleRate / 8);
        this.node2.fftSize = roundDownToPowerOfTwo(ctx.sampleRate / 8);

        this.canvasContainer = document.createElement('div');
        this.canvas = document.createElement('canvas');
        this.canvas.height = 300;
        this.canvasContainer.appendChild(this.canvas);
        this.panel.appendChild(this.canvasContainer);
        this.addNewSetting('Node', '', null, this.node, null, this.node2);
        this.maximized = false;
        this.animationId = 0;
        this.canvas.addEventListener('mousedown', e => {
            // alert(e.layerX / this.canvas.width * ctx.sampleRate / 2 + " Hz");
            this.maximized = !this.maximized;
            this.setMaximized(this.maximized);
        });
        this.update();
    }

    update() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        let buffer = new Uint8Array(this.node.frequencyBinCount);
        let buffer2 = new Uint8Array(this.node2.frequencyBinCount);

        let node = this.node;
        let node2 = this.node2;
        let canvasCtx = this.canvas.getContext('2d');
        let canvas2 = document.createElement('canvas');

        let canvas = this.canvas;

        let half = parseInt(canvas.height / 2);

        canvas2.width = canvas.width;
        canvas2.height = half;

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let draw = () => {
            this.animationId = requestAnimationFrame(draw);
            node.getByteFrequencyData(buffer);
            node2.getByteFrequencyData(buffer2);

            canvas2.getContext('2d').drawImage(canvas, 0, half, canvas.width, half, 0, 0, canvas.width, half);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = buffer.length / canvas.width;
            let posX = 0;
            canvasCtx.strokeStyle = '#ffffff';
            // canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            for (let i = 0; i < buffer2.length; i += barWidth) {
                let barHeight = buffer2[parseInt(i)] / 255 * half;
                if (barHeight < 0) barHeight = 0;
                canvasCtx.lineTo(posX, half - 1 - barHeight);

                posX++;
            }

            canvasCtx.fillRect(0, half, canvas.width, half);
            posX = 0;
            for (let i = 0; i < buffer.length; i += barWidth) {
                let barHeight = buffer[parseInt(i)] / 255 * half;
                if (barHeight < 0) barHeight = 0;
                canvasCtx.fillStyle = colorTrans(palette, barHeight / half);
                canvasCtx.fillRect(posX, half, 1, 1);
                posX++;
            }

            canvasCtx.stroke();
            canvasCtx.drawImage(canvas2, 0, half + 1, canvas.width, half);
        };

        this.animationId = requestAnimationFrame(draw);
    }


    setMaximized(value) {
        if (value) {
            fs.setFullscreen(this.canvas);
            this.canvas.width = window.visualViewport.width * window.visualViewport.scale * dpr;
            this.canvas.height = window.visualViewport.height * window.visualViewport.scale * dpr;
        } else {
            this.canvasContainer.appendChild(fs.exitFullscreen());
            this.canvas.width = 300;
            this.canvas.height = 300;
        }
        this.update();
    }
}

class NewView extends AudioNodeView {
    constructor() {
        super();
        this.node = new AudioWorkletNode(ctx, "absolute-value");
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class ChannelSplitterNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createChannelSplitter();
        this.c1 = ctx.createGain();
        this.c2 = ctx.createGain();
        this.c3 = ctx.createGain();
        this.c4 = ctx.createGain();
        this.c5 = ctx.createGain();
        this.c6 = ctx.createGain();
        this.node.connect(this.c1, 0);
        this.node.connect(this.c2, 1);
        this.node.connect(this.c3, 2);
        this.node.connect(this.c4, 3);
        this.node.connect(this.c5, 4);
        this.node.connect(this.c6, 5);
        this.addNewSetting('Input', '', null, this.node);
        this.addNewSetting('L', '', null, null, null, this.c1);
        this.addNewSetting('R', '', null, null, null, this.c2);
        this.addNewSetting('C', '', null, null, null, this.c3);
        this.addNewSetting('LFE', '', null, null, null, this.c4);
        this.addNewSetting('SL', '', null, null, null, this.c5);
        this.addNewSetting('SR', '', null, null, null, this.c6);
    }
}

class ChannelMergerNodeView extends AudioNodeView {
    constructor() {
        super();
        this.node = ctx.createChannelMerger();
        this.c1 = ctx.createGain();
        this.c2 = ctx.createGain();
        this.c3 = ctx.createGain();
        this.c4 = ctx.createGain();
        this.c5 = ctx.createGain();
        this.c6 = ctx.createGain();
        this.c1.connect(this.node, 0, 0);
        this.c2.connect(this.node, 0, 1);
        this.c3.connect(this.node, 0, 2);
        this.c4.connect(this.node, 0, 3);
        this.c5.connect(this.node, 0, 4);
        this.c6.connect(this.node, 0, 5);
        this.addNewSetting('L', '', null, this.c1);
        this.addNewSetting('R', '', null, this.c2);
        this.addNewSetting('C', '', null, this.c3);
        this.addNewSetting('LFE', '', null, this.c4);
        this.addNewSetting('SL', '', null, this.c5);
        this.addNewSetting('SR', '', null, this.c6);
        this.addNewSetting('Output', '', null, null, null, this.node);
    }
}

class WelcomeView extends AudioNodeView {
    constructor() {
        super();
        this.panel.appendChild(createLocaleHTMLItem("text.welcome"));
        this.panel.style.minWidth = 'unset';
        this.panel.style.width = '500px';
    }
}
class ControlsView extends AudioNodeView {
    constructor() {
        super();
        this.panel.appendChild(createLocaleHTMLItem(isMobile ? "text.controls-touch" : "text.controls"));
        this.panel.style.minWidth = 'unset';
        this.panel.style.width = '500px';
    }
}

function save() {
    let map = {
        "nodes": [],
        "settings": {}
    };

    for (const setting in settings) {
        let s = settings[setting];
        let n = {
            "type": s.type,
            "outputs": []
        }
        n.value = s.getValue();
        for (const id in s.outputLines) {
            n.outputs.push(id);
        }
        map.settings[setting] = n;
    }

    for (const node of nodes) {
        let n = {
            "type": node.constructor.name,
            "x": node.x,
            "y": node.y,
            "settings": {}
        }
        for (let setting in node.settings) {
            n.settings[setting] = node.settings[setting].id;
        }

        map.nodes.push(n);
    }
    return map;
}

function load(save_object) {
    for (const node of nodes) {
        node.remove();
    }

    let ids = {}

    for (const node of save_object.nodes) {
        let view = new (eval(node.type))();
        view.moveTo(node.x, node.y);

        for (const name in node.settings) {
            if (Object.hasOwnProperty.call(node.settings, name)) {
                const saved_setting = save_object.settings[node.settings[name]];
                const setting = view.getSetting(name);

                try {
                    setting.edit(saved_setting.value);
                } catch (error) {
                    console.warn(error);
                }
                ids[node.settings[name]] = setting;
            }
        }
    }

    for (const id in save_object.settings) {
        if (Object.hasOwnProperty.call(save_object.settings, id)) {
            const outputs = save_object.settings[id].outputs;
            for (const output of outputs) {
                try {
                    console.log("[" + id + "]", ids, ids[id]);
                    ids[id].connect(ids[output]);
                } catch (error) {
                    console.warn(error);
                }
            }
        }
    }
}

let suspend = true;
html.addEventListener('contextmenu', e => {
    e.preventDefault(); // Prevent the default right-click context menu

    if (suspend) {
        ctx.resume();
        suspend = false;
    }

    const menuItems = [
        {
            category: 'Generators',
            items: [
                { view: ConstantSourceView },
                { view: OscillatorNodeView },
                { view: NoiseGeneratorView }
            ]
        },
        {
            category: 'Processors',
            items: [
                { view: GainNodeView },
                { view: DynamicsCompressorNodeView },
                { view: DelayNodeView },
                { view: BiquadFilterNodeView },
                { view: ConvolverNodeView },
                { view: AbsoluteValueView }
            ]
        },
        {
            category: 'Spatialization',
            items: [
                { view: PannerNodeView },
                { view: StereoPannerNodeView }
            ]
        },
        {
            category: 'AudioIO',
            items: [
                { view: AudioSourceView },
                { view: AudioInputNodeView },
                { view: AudioRecorderView }
            ]
        },
        {
            category: 'ChannelOperators',
            items: [
                { view: ChannelSplitterNodeView },
                { view: ChannelMergerNodeView }
            ]
        },
        {
            category: 'Visualizers',
            items: [
                { view: WavesView },
                { view: SpectrumViewV2 }
            ]
        }
    ];

    const mouseX = e.clientX + window.scrollX; // X-coordinate of the mouse
    const mouseY = e.clientY + window.scrollY; // Y-coordinate of the mouse

    const menu = document.createElement('div'); // Create a new div for the menu
    menu.classList.add('panel')
    menu.style.left = `${mouseX}px`; // Position the menu at the mouse coordinates
    menu.style.top = `${mouseY}px`;
    menu.style.paddingBottom = '5px';
    menu.style.zIndex = `999`;

    menuItems.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.textContent = getLocale('category.' + category.category);
        categoryItem.classList.add('menu-item');
        menu.appendChild(categoryItem);

        const submenu = document.createElement('div');
        submenu.classList.add('panel');
        submenu.style.display = 'none';
        submenu.style.left = '90%';
        submenu.classList.add('submenu');
        categoryItem.appendChild(submenu);

        category.items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = getLocale('view.' + item.view.name);
            menuItem.classList.add('menu-item');
            submenu.appendChild(menuItem);

            menuItem.addEventListener('click', () => {
                let view = new item.view(); // Create a new instance of the corresponding view
                view.moveTo(mouseX, mouseY);
                menu.remove(); // Remove the menu after selecting an item
            });
        });

        // Toggle submenu visibility on mouse hover
        categoryItem.addEventListener(isMobile ? 'click' : 'mouseover', e => {
            submenu.style.display = 'block';
            submenu.style.top = categoryItem.offsetTop + 'px';
            categoryItem.classList.add('expanded');
            e.stopPropagation()
        });

        categoryItem.addEventListener('mouseleave', () => {
            submenu.style.display = 'none';
            categoryItem.classList.remove('expanded');
        });
    });




    const saveButton = document.createElement('div');
    saveButton.textContent = getLocale('operation.save');
    saveButton.classList.add('menu-item')
    menu.appendChild(saveButton);
    // Attach a click event listener to the button
    saveButton.addEventListener('click', () => {
        // Call the save() function to retrieve the data
        const data = save();

        // Convert the data to JSON string
        const jsonString = JSON.stringify(data);

        // Copy the JSON string to the clipboard
        navigator.clipboard.writeText(jsonString)
            .then(() => {
                alert('JSON string copied to clipboard');
            })
            .catch((error) => {
                console.error('Failed to copy JSON string to clipboard:', error);
            });
    });

    const loadButton = document.createElement('div');
    loadButton.textContent = getLocale('operation.load');
    loadButton.classList.add('menu-item')
    menu.appendChild(loadButton);
    // Attach a click event listener to the button
    loadButton.addEventListener('click', () => {
        // Prompt the user to enter a JSON string
        const jsonString = prompt('Enter JSON string:');

        // Check if the user entered a JSON string
        if (jsonString) {
            try {
                // Parse the JSON string into an object
                const data = JSON.parse(jsonString);

                // Call the load() function to process the loaded data
                load(data);
            } catch (error) {
                console.error('Invalid JSON string:', error);
            }
        }
    });

    const clearAll = document.createElement('div');
    clearAll.textContent = getLocale('operation.clear-all');
    clearAll.classList.add('menu-item');
    menu.appendChild(clearAll);
    clearAll.addEventListener('click', () => {
        for (const node of nodes) {
            node.remove();
        }
        new AudioOutputNodeView();
    });


    // Event listener to remove the menu when clicking outside of it
    const removeMenu = () => {
        menu.remove();
        document.removeEventListener('click', removeMenu);
    };

    document.addEventListener('click', removeMenu);

    document.body.appendChild(menu); // Append the menu to the document body
});

if (isMobile) {
    html.addEventListener('click', e => {
        if (selectedPanel) {
            selectedPanel.moveTo(e.clientX + window.scrollX, e.clientY + window.scrollY);
            selectedPanel.panel.classList.remove('selected');
            selectedPanel = null;
        }
    });
}

window.onbeforeunload = function () {
    window.localStorage.setItem('lastNodes', JSON.stringify(save()))
    return "Are you sure you want to leave this page? Changes you made may not be saved.";
};

if (isMobile) window.visualViewport.onscroll = e => {
    fs.followScreen();
}

new AudioOutputNodeView();