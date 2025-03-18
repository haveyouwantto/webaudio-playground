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
                const threshold = parameters.threshold[j] || parameters.threshold[0];
                const sample = channelInput[j];
                const sampleGreater = channelInputGreater ? channelInputGreater[j] : inputGreater[0] ? inputGreater[0][j] : 0; // Handle null input
                const sampleLesser = channelInputLesser ? channelInputLesser[j] : inputLesser[0] ? inputLesser[0][j] : 0; // Handle null input
                channelOutput && (channelOutput[j] = sample > threshold ? sampleGreater : sampleLesser);
            }
        }

        return true;
    }
}

class ComplexSineProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [{
        name: 'frequency',
        defaultValue: 440,
        minValue: 20,
        maxValue: 20000,
        automationRate: 'a-rate' // 关键：指定 automationRate 为 'a-rate'
      }];
    }
  
    constructor() {
      super();
      this.phase = 0;
      this.sampleRate = sampleRate;
    }
  
    process(inputs, outputs, parameters) {
      const output = outputs[0];
      // 确保是双声道输出
      const leftChannel = output[0]; // 实部
      const rightChannel = output[1]; // 虚部
      const frequencies = parameters.frequency; // 获取频率数组，因为是 a-rate
    //   console.log(frequencies)
  
      for (let i = 0; i < leftChannel.length; i++) {
        const frequency = frequencies[i] ?? frequencies[0]; // 获取当前帧的频率
        const omega = 2 * Math.PI * frequency / this.sampleRate;
        
        const real = Math.cos(this.phase);
        const imag = Math.sin(this.phase);
  
        leftChannel[i] = real;
        rightChannel[i] = imag;
        
        this.phase += omega;
        //this.phase %= (2 * Math.PI); // 周期重置
      }
  
      return true;
    }
  }



registerProcessor('white-noise', WhiteNoiseProcessor);
registerProcessor('absolute-value', AbsoluteValueProcessor);
registerProcessor('bitcrusher-processor', BitcrusherProcessor);
registerProcessor('conditional-processor', ConditionalProcessor);
registerProcessor('complex-sine-processor', ComplexSineProcessor);