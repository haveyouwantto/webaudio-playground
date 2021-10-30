window.AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = new AudioContext();

let settings = {};
let nodes = [];

function drawLine(x1, y1, x2, y2) {
    var svgns = "http://www.w3.org/2000/svg";
    let line = document.createElementNS(svgns, "line");
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', 2);
    document.querySelector('#lines').appendChild(line);
    return line;
}

class AudioNodeView {
    constructor(x = 8, y = 8, removeable = true) {
        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        this.dragX = x;
        this.dragY = y;

        this.panel.style.left = x + 'px';
        this.panel.style.top = y + 'px';

        this.innerDiv = document.createElement('div');
        this.innerDiv.className = 'panel-title';
        this.innerDiv.setAttribute('draggable', true);
        this.innerDiv.addEventListener('dragstart', e => {
            let pos = this.panel.getBoundingClientRect();
            this.dragX = e.clientX - pos.x;
            this.dragY = e.clientY - pos.y;
        });
        this.innerDiv.addEventListener('dragend', e => {
            this.panel.style.left = (e.clientX - this.dragX) + 'px';
            this.panel.style.top = (e.clientY - this.dragY) + 'px';
            for (const setting in this.settings) {
                const element = this.settings[setting];
                element.updateLines();
            }
        });
        if (removeable) this.innerDiv.addEventListener('dblclick', e => {
            for (const e in this.settings) {
                if (Object.hasOwnProperty.call(this.settings, e)) {
                    const element = this.settings[e];
                    element.disconnectAll();
                }
            }
            document.querySelector('body').removeChild(this.panel);
        });
        this.setTitle('Audio Node');
        this.panel.appendChild(this.innerDiv);

        document.querySelector('body').appendChild(this.panel);
        nodes.push(this);

        this.settings = {};
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
            this.settings[name] = null;
            return true;
        }
        return false;
    }
}

class Setting {
    constructor(name, type, value, input = null, valChange = input, output = null) {
        this.div = document.createElement('div');
        this.div.className = 'setting';
        this.id = Math.random() + '';
        this.inputs = [];
        this.outputs = [];
        this.outputLines = {};
        this.name = name;

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
            this.inputTag = inputTag;
        }

        this.div.appendChild(document.createTextNode(name + ' : '))
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
                field = document.createElement('input');
                field.className = 'input-number';
                field.type = 'source';
                field.setAttribute('list', this.id + '-list');
                let src = document.createElement('datalist');
                src.id = this.id + '-list';
                for (const key in value) {
                    if (Object.hasOwnProperty.call(value, key)) {
                        const element = value[key];
                        let option = document.createElement('option');
                        option.value = element;
                        src.appendChild(option);
                    }
                }
                field.addEventListener('change', e => {
                    console.log(1);
                    valChange['type'] = field.value;
                });
                field.appendChild(src);
                this.div.appendChild(field);
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
            this.outputTag = outputTag;
        }
        this.input = input;
        this.output = output;
        settings[this.id] = this;
    }

    connect(node) {
        this.outputs.push(node);
        node.inputs.push(this);
        this.output.connect(node.input);
        node.field && (node.field.disabled = true);

        let pos1 = this.outputTag.getBoundingClientRect();
        let pos2 = node.inputTag.getBoundingClientRect();
        this.outputLines[node.id] = drawLine(pos1.x + pos1.width / 2, pos1.y + pos1.height / 2, pos2.x + pos2.width / 2, pos2.y + pos2.height / 2);
        console.log(this.outputLines);

        console.log(`Connected ${this.name} to ${node.name}`);
        try {
            this.output.start();
        } catch (e) {
            console.warn(e);
        }
    }

    disconnect(node) {

        // FIXME remove item
        // this.outputs.remove(node);
        // node.inputs.remove(this);

        this.output.disconnect(node.input);
        document.querySelector('#lines').removeChild(this.outputLines[node.id]);
        node.field && (node.field.disabled = false);
        console.log(`Disconnected ${this.name} from ${node.name}`);
    }

    destroy() {
        this.disconnectAll();
        this.output.stop();
    }

    updateLines(stop = false) {
        for (let node of this.outputs) {
            try {
                let e = this.outputLines[node];
                let pos1 = this.outputTag.getBoundingClientRect();
                let pos2 = node.inputTag.getBoundingClientRect();
                this.outputLines[node.id].setAttribute('x1', pos1.x + pos1.width / 2);
                this.outputLines[node.id].setAttribute('y1', pos1.y + pos1.height / 2);
                this.outputLines[node.id].setAttribute('x2', pos2.x + pos2.width / 2);
                this.outputLines[node.id].setAttribute('y2', pos2.y + pos2.height / 2);
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
        this.setTitle('Audio Output');
        this.addNewSetting('Node', '', null, ctx.destination);
    }
}

class OscillatorNodeView extends AudioNodeView {
    constructor() {
        super();
        this.setTitle('Oscillator');
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
        this.setTitle('Gain');
        this.node = ctx.createGain();
        this.addNewSetting('Gain', 'num', this.node.gain.value, this.node.gain);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class DynamicsCompressorNodeView extends AudioNodeView {
    constructor() {
        super();
        this.setTitle('Compressor');
        this.node = new DynamicsCompressorNode(ctx);
        this.addNewSetting('Node', '', null, this.node, null, this.node);
    }
}

class PannerNodeView extends AudioNodeView {
    constructor() {
        super();
        this.setTitle('Panner');
        this.node = new PannerNode(ctx);
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
        this.setTitle('Audio Source');
        this.buffer = null;
        this.uploadBtn();
    }

    uploadBtn() {
        let input = document.createElement('input');
        input.type = 'file';
        input.addEventListener('change', e => {
            if (input.files[0]) {
                let fr = new FileReader();
                fr.readAsArrayBuffer(input.files[0]);
                fr.onloadend = () => {
                    ctx.decodeAudioData(fr.result).then(buffer => {
                        this.buffer = buffer;
                        let source = ctx.createBufferSource();
                        source.loop = true;
                        source.buffer = this.buffer;
                        this.removeSetting('Node');
                        this.addNewSetting('Node', '', null, null, null, source)
                    });
                };
            }
        });
        this.panel.appendChild(input);
    }
}

let out = new AudioOutputNodeView();

document.addEventListener('keypress', e => {
    switch (e.key) {
        case 'o':
            new OscillatorNodeView();
            break;
        case 'g':
            new GainNodeView();
            break;
        case 'c':
            new DynamicsCompressorNodeView();
            break;
        case 'p':
            new PannerNodeView();
            break;
        case 'a':
            new AudioSourceView();
            break;
        default:
            break;
    }
});