class WhiteNoiseProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        output.forEach(channel => {
            for (let i = 0; i < channel.length; i++) {
                channel[i] = Math.random() * 2 - 1;
            }
        });
        return true;
    }
}

class AbsoluteValueProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const input = inputs[0];
        for (let i = 0; i < input.length; i++) {
            let channel = input[i];
            for (let j = 0; j < channel.length; j++) {
                output[i][j] = Math.abs(input[i][j]);
            }
        }
        return true;
    }
}

class BinaryInputProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        output.forEach(channel => {
            for (let i = 0; i < channel.length; i += 16) {
                let val = Math.random() > 0.5 ? 1 : 0;
                for (let j = 0; j < 16; j++) {
                    channel[i + j] = val;
                }
            }
        });
        return true;
    }
}

class AdditionProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const input1 = inputs[0];
        const input2 = inputs[0];
        for (let i = 0; i < input.length; i++) {
            let channel = input[i];
            for (let j = 0; j < channel.length; j++) {
                output[i][j] = input1[i][j] + input2[i][j];
            }
        }
        return true;
    }
}

registerProcessor('white-noise', WhiteNoiseProcessor);
registerProcessor('absolute-value', AbsoluteValueProcessor);
registerProcessor('binary-input', BinaryInputProcessor);