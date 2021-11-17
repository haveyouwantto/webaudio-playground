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

registerProcessor('white-noise', WhiteNoiseProcessor);
registerProcessor('absolute-value', AbsoluteValueProcessor);