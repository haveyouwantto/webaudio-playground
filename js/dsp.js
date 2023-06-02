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

function fftPreprocess(data) {
    const n = data.length;
    data = data.map(e => new Complex(e, 0));
    const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));
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
    const halfOutput = shifted.slice(0, half);

    return halfOutput;
}