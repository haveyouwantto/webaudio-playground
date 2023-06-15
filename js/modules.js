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

class BitcrusherProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            {
                name: 'bitDepth',
                defaultValue: 8,
                minValue: 1,
                maxValue: 16,
                automationRate: 'a-rate',
            }
        ];
    }

    constructor() {
        super();
        this.phase = 0;
        this.lastSample = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const bitDepth = parameters.bitDepth[0];
        const max = Math.pow(2, bitDepth) - 1;

        for (let i = 0; i < input.length; i++) {
            const channel = input[i];
            const outputChannel = output[i];

            for (let j = 0; j < channel.length; j++) {
                // Apply bit reduction
                let sample = channel[j];
                const shiftedNum = sample + 1;

                // Scale the shifted number to the desired range (0 to 3)
                const scaledNum = shiftedNum * (max / 2);

                // Round the scaled number to the nearest integer
                const mappedInt = Math.round(scaledNum);
                outputChannel[j] = mappedInt / max - 0.5;
            }
        }


        return true;
    }
}

class ConditionalProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            {
                name: 'threshold', defaultValue: 0.5,
                automationRate: 'a-rate'
            }
        ];
    }


    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const input = inputs[0];
        const inputGreater = inputs[1];
        const inputLesser = inputs[2];
      
        for (let i = 0; i < input.length; i++) {
          const channelInput = input[i];
          const channelInputGreater = inputGreater[i];
          const channelInputLesser = inputLesser[i];
          const channelOutput = output[i];
      
          for (let j = 0; j < channelInput.length; j++) {
            const threshold = parameters.threshold[j];
            const sample = channelInput[j];
            const sampleGreater = channelInputGreater ? channelInputGreater[j] : 0; // Handle null input
            const sampleLesser = channelInputLesser ? channelInputLesser[j] : 0; // Handle null input
      
            channelOutput && (channelOutput[j] = sample && sample > threshold ? sampleGreater : sampleLesser); // Output zero if sample is null
          }
        }
      
        return true;
      }
}





registerProcessor('white-noise', WhiteNoiseProcessor);
registerProcessor('absolute-value', AbsoluteValueProcessor);
registerProcessor('bitcrusher-processor', BitcrusherProcessor);
registerProcessor('conditional-processor', ConditionalProcessor);