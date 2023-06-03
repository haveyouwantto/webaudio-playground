class Complex {
    constructor(real = 0, imag = 0) {
        this.re = real;
        this.im = imag;
    }

    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }

    subtract(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }

    multiply(other) {
        const real = this.re * other.re - this.im * other.im;
        const imag = this.re * other.im + this.im * other.re;
        return new Complex(real, imag);
    }

    divide(other) {
        const denominator = other.re * other.re + other.im * other.im;
        const real = (this.re * other.re + this.im * other.im) / denominator;
        const imag = (this.im * other.re - this.re * other.im) / denominator;
        return new Complex(real, imag);
    }

    get modulus() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    get conjugate() {
        return new Complex(this.re, -this.im);
    }

    static fromExponentialForm(modulus, angle) {
        const real = modulus * Math.cos(angle);
        const imag = modulus * Math.sin(angle);
        return new Complex(real, imag);
    }

    toExponentialForm() {
        const modulus = this.modulus;
        const angle = Math.atan2(this.im, this.re);
        return { modulus, angle };
    }

    static exponential(theta) {
        const real = Math.cos(theta);
        const imag = Math.sin(theta);
        return new Complex(real, imag);
    }

    toString() {
        if (this.im >= 0) {
            return `${this.re} + ${this.im}i`;
        } else {
            return `${this.re} - ${-this.im}i`;
        }
    }
}

function fft(input) {
    const N = input.length;

    if (N <= 1) {
        return input;
    }

    const even = fft(input.filter((_, index) => index % 2 === 0));
    const odd = fft(input.filter((_, index) => index % 2 === 1));

    const output = new Array(N);

    for (let k = 0; k < N / 2; k++) {
        const t = Complex.exponential(-2 * Math.PI * k / N).multiply(odd[k]);
        output[k] = even[k].add(t);
        output[k + N / 2] = even[k].subtract(t);
    }

    return output;
}

function resampleFloat32Array(input, outputLength) {
    const inputLength = input.length;
    const ratio = inputLength / outputLength;

    const output = new Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const index = i * ratio;
        const floorIndex = Math.floor(index);
        const ceilIndex = Math.ceil(index);

        if (floorIndex === ceilIndex) {
            output[i] = input[floorIndex];
        } else {
            const fraction = index - floorIndex;
            const floorValue = input[floorIndex];
            const ceilValue = input[ceilIndex];

            output[i] = (1 - fraction) * floorValue + fraction * ceilValue;
        }
    }

    return output;
}


function fftPreprocess(data) {
    data = data.map(e => new Complex(e, 0));

    const paddedLength = Math.pow(2, Math.ceil(Math.log2(data.length)));
    const paddedData = padWithZeros(data, paddedLength);
    return paddedData;
}

function padWithZeros(array, length) {
    const paddedArray = array.slice();
    while (paddedArray.length < length) {
        paddedArray.push(new Complex(0, 0));
    }
    return paddedArray;
}

function fftshift(input) {
    const N = input.length;
    const half = Math.floor(N / 2);

    const shifted = new Array(N);

    for (let i = 0; i < half; i++) {
        shifted[i] = input[i + half];
        shifted[i + half] = input[i];
    }

    return shifted;
}

function halfFFT(input) {
    const N = input.length;
    const half = Math.floor(N / 2);

    const shifted = fftshift(input);
    // Take the first half of the shifted array
    const halfOutput = shifted.slice(half);

    return halfOutput;
}

function clampArray(array, i) {
    if (i < 0) return array[0];
    let n = array.length;
    if (i >= n) return array[n - 1];
    return array[i];
}

function resampleArray(array, desiredLength) {
    const originalLength = array.length;
    const ratio = originalLength / desiredLength;

    const result = new Array(desiredLength);

    for (let i = 0; i < desiredLength; i++) {
        const sampleIndex = i * ratio;
        const floorIndex = Math.floor(sampleIndex);
        const frac = sampleIndex - floorIndex;

        const x0 = clampArray(array, floorIndex - 1)
        const x1 = clampArray(array, floorIndex)
        const x2 = clampArray(array, floorIndex + 1)
        const x3 = clampArray(array, floorIndex + 2)

        const a0 = x3 - x2 - x0 + x1;
        const a1 = x0 - x1 - a0;
        const a2 = x2 - x0;
        const a3 = x1;

        result[i] = a0 * frac * frac * frac + a1 * frac * frac + a2 * frac + a3;
    }

    return result;
}