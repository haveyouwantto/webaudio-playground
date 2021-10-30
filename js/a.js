

class Osc {
    constructor(freq, amp) {
        this.osc = ctx.createOscillator();
        this.osc.frequency.value = freq;
        this.gain = ctx.createGain();
        this.gain.gain.value = amp;
        // let btn = document.createElement('button');
        // btn.appendChild(document.createTextNode(`${freq} - ${amp}`));
        // btn.addEventListener('click', () => {
        //     this.start();
        // });
        // document.getElementById('s').appendChild(btn);
    }

    connect(node) {
        this.osc.connect(this.gain);
        this.gain.connect(node);
    }

    start() {
        this.osc.start();
    }
}

let base = 252;

var osc = new Osc(base, 1);
var osc2 = new Osc(base*2, 250);
var osc3 = new Osc(base*3, 326);
var osc4 = new Osc(base*4, 231);

var gain2 = ctx.createGain();
gain2.gain.value = 0.1;

osc4.connect(osc3.osc.frequency)
osc3.connect(osc2.osc.frequency);
osc2.connect(osc.osc.frequency);
osc.connect(gain2);
gain2.connect(ctx.destination);


var dest = ctx.createMediaStreamDestination();
var mediaRecorder = new MediaRecorder(dest.stream);
var chunks = [];
gain2.connect(dest);

document.getElementById('all').addEventListener('click',()=>{
    osc.start();
    osc2.start();
    osc3.start();
    osc4.start();
    mediaRecorder.start();
});

document.getElementById('stop').addEventListener('click',()=>{
    mediaRecorder.stop();
});