function initP5(w, h) {
    return function(p) {
        p.setup = function() {
            var c = p.createCanvas(w, h);
            c.addClass('p5-canvas');
            p.noLoop();
        };
        p.draw = function() {
            p.clear();
            p.background(0, 0);
            //drawForms(p, getForms() || []);
        };
    }
}

/* function maybeCachedImage(p, f) {
    return p.createImg(f.data);
} */

var PRODUCTS = [


    { label: 'IJ',  id: 'intellij-idea', palette: [ '#1a7ff6', '#fb3560', '#f77a29' ] },  // idea // IJ_
    { label: 'PS',  id: 'phpstorm',      palette: [ '#b24eee', '#7660f4', '#fc378c' ] },  // phpstorm // PS_
    { label: 'PC',  id: 'pycharm',       palette: [ '#31d68b', '#fcf65a', '#24c4f0' ] },  // pycharm // PC_
    { label: 'RM',  id: 'rubymine',      palette: [ '#fc2555', '#fd8638', '#8f41cd' ] },  // rubymine // RM_
    { label: 'WS',  id: 'webstorm',      palette: [ '#22cdd6', '#2888d4', '#feee56' ] },  // webstorm // WS_
    { label: 'CL',  id: 'clion',         palette: [ '#32d791', '#1a9edd', '#ea3a8c' ] },  // clion // CL_
    { label: 'DG',  id: 'datagrip',      palette: [ '#32d791', '#9779f5', '#fd5fe4' ] },  // // DG_
    { label: 'AC',  id: 'appcode',       palette: [ '#2b7fe3', '#25daee', '#30de95' ] },  // appcode // AC_
    { label: 'R++',  id: 'resharper-cpp', palette: [ '#fdbc2c', '#e14ce3', '#c21456' ] },  // // R++_
    { label: 'DC',  id: 'dotcover',      palette: [ '#fd7522', '#786bfb', '#e14ce3' ] },  // dotcover // DC_
    { label: 'DM',  id: 'dotmemory',     palette: [ '#fdbc2c', '#786bfb', '#e14ce3' ] },  // // DM_
    { label: 'DP',  id: 'dotpeek',    palette: [ '#23cbfc', '#786bfb', '#e14ce3' ] },  // // DP_
    { label: 'DT',  id: 'dottrace',      palette: [ '#fc1681', '#786bfb', '#e14ce3' ] },  // dottrace // DT_
    { label: 'R#',  id: 'resharper',     palette: [ '#c21456', '#e14ce3', '#fdbc2c' ] },  // resharper // R#_
    { label: 'UP',  id: 'upsource',      palette: [ '#22b1ef', '#9062f7', '#fd8224' ] },  // upsource // UP_
    { label: 'TC',  id: 'teamcity',      palette: [ '#22b1ef', '#9062f7', '#46e869' ] },  // teamcity // TC_
    { label: 'HB',  id: 'hub',           palette: [ '#1fb9ee', '#965ff7', '#feec56' ] },  // hub // HB_
    { label: 'YT',  id: 'youtrack',      palette: [ '#22b1ef', '#9062f7', '#fc378c' ] },  // youtrack // YT_
    { label: 'MPS', id: 'mps',           palette: [ '#31d68b', '#3188cd', '#f1e969' ] },  // mps // MPS_
    { label: 'KT',  id: 'kotlin',        palette: [ '#1b84f2', '#24dea7', '#ed4baa' ] },   // kotlin // KT_
    { label: 'N1',   id: 'neon-1',        palette: [ '#ff0000', '#00ff00', '#0000ff' ] }, // neon-1
    { label: 'N2',   id: 'neon-2',        palette: [ '#ffff00', '#ff00ff', '#00ffff' ] }, // neon-2
    { label: 'JB1',  id: 'jetbrains',   palette: [ '#ec4476', '#fde74a', '#9151e1' ] } // jetbrains-1

];

function numberToHex(num) { return (num > 15) ? num.toString(16) : '0' + num.toString(16); }

function toHexColor(color) {
    return '#' + numberToHex(color.r || 0)
               + numberToHex(color.g || 0)
               + numberToHex(color.b || 0);
}

function _rgb(r, g, b, a) {
    return { r: r, g: g, b: b, a: a };
}

function howMuch(single, plural) {
    return function(list) {
        if (!list) return 'Nothing';
        if (list.length == 0) return 'No ' + plural;
        if (list.length == 1) return 'One ' + single;
        if (list.length == 2) return 'Two ' + plural;
        return list.length + ' ' + plural;
    };
}

function stopPropagation(event) {
    event.stopPropagation();
    return event;
}

// ============= Sketch-specific =============

var imagesToLoad = PRODUCTS.map(function(product) {
    return {
        product: product.id,
        path: 'logos/' + product.id + '-text-square.svg'
    };
});

var readyImgCount = 0;
var productsImages = {};
function loadSketchImages(p) {
    imagesToLoad.forEach(function(imgSpec) {
        var img = new Image();
        console.log('start loading image for', imgSpec.product);
        img.onload = function() {
            console.log('received', imgSpec.path);
            productsImages[imgSpec.product] = img;
            readyImgCount++;
            console.log('images ready:', readyImgCount + '/' + imagesToLoad.length);
            if (readyImgCount == imagesToLoad.length) {
                hideLoader();
                console.log('finished loading images');
            }
        };
        img.onerror = function() {
            console.log('image at ' + imgSpec.path + ' failed to load');
            readyImgCount++;
            console.log('images ready:', readyImgCount + '/' + imagesToLoad.length);
            if (readyImgCount == imagesToLoad.length) {
                hideLoader();
                console.log('finished loading images');
            }
        };
        img.src = imgSpec.path;
    });
}

// jb/noise
var EMPTY_PIXELS = {
  width: 0,
  height: 0,
  values: [],
  step: 10,
  seed: -1,
  density: -1,
  time: -1
};
function initNoiseSketch() {

    var refresher;
    //var values = Kefir.emitter();

    function refreshSketch(inlets) {
        return refresher ? refresher(inlets) : EMPTY_PIXELS;
    }

    var noiseSketch = function(p) {
        var width = window.innerWidth;
        var height = window.innerHeight;

        var setupCalled = false;

        p.setup = function() {
            var cvs = p.createCanvas(width, height).parent('rpd-jb-preview-target');
            //cvs.position(-5000, -5000);
            cvs.canvas.className = 'noise-canvas';
            cvs.canvas.style.display = 'none';
         //  console.log(cvs);
            //cvs.style.display = 'none';
            p.noLoop();
            setupCalled = true;
        };

        var lastPixels;
        var lastSeed;
        var lastValues;
        var lastStep;
        refresher = function(inlets) {
            if (!setupCalled) return;
            p.noiseDetail(inlets.lod, inlets.falloff);
            lastSeed = p.random(1000);
            lastStep = inlets.step;
            p.noiseSeed(lastSeed);
            p.redraw();
            return lastPixels;
        };

        p.draw = function() {
            p.clear();
            p.noStroke();
            //lastValues = [];
            var x, y, c;

            //for (var x = 0; x <= width/2+10; x+=10) {
            for (x = 0; x < width; x+=lastStep) {
                //var column = [];
                for (y = 0; y < height; y+=lastStep) {
                    c = 255 * p.noise(0.005 * x, 0.005 * y);
                    //c = (x / width) * 255;
                    p.fill(c);
                    p.rect(x, y, 10, 10);
                    //p.rect(width - x, y, 10, 10);
                    //column.push(c);
                }
                //lastValues.push(column);
            }
            p.loadPixels();
            lastPixels = {
                width: width,
                height: height,
                values: p.pixels,
                //values: lastValues,
                step: lastStep || 10,
                time: new Date(),
                density: p.pixelDensity(),
                seed: lastSeed
            };
        };
    };

    var noiseP5 = new p5(noiseSketch);

    return refreshSketch;

}

// jb/draw-pixels
function drawPixels(p, pixels) {
    p.loadPixels();

    var src = pixels.values;
    var pixels = p.pixels;

    // console.log('copying', src.length, 'pixels to', pixels.length, 'pixels');
    for (var i = 0; i < src.length; i++) {
        pixels[i] = src[i];
    }

    p.updatePixels();
}

// jb/collect-point-data
function collectPointData(pixels, config) {

    var srcPixels = pixels.values;

    if (!srcPixels || !srcPixels.length) return [];

    var step = Math.floor(config.step || pixels.step);

    if (!step) return [];

    var chaos = config.chaos;
    var d = pxDensity;
    var srcWidth = pixels.width;
    var srcHeight = pixels.height;

    var dsrcWidth = srcWidth * d;
    var dsrcHeight = srcHeight * d;

    var maxPoints =  dsrcWidth * dsrcHeight * 4;

    console.log('collectPointData', dsrcWidth, 'x', dsrcHeight, 'pixels length', srcPixels.length,
                'expected length', maxPoints);

    var idx, pxBrightness, r, g, b, a;

    var lastPoint;

    var pointData = [];

    var xpos, ypos;


    for (var x = 0; x < srcWidth; x += step) {
        for (var y = 0; y < srcHeight; y += step) {
            // console.log('y', y, pointData.length >= maxPoints);
            pxBrightness = pixelBrightnessByCoords(x, y, srcPixels, srcWidth, d);

            if ((pxBrightness > 40) && (random(0, pxBrightness) < 30)) {

                xpos = x + random(-step / 2, step / 2) * chaos;
                ypos = y + random(-step / 2, step / 2) * chaos;

                pointData.push([ xpos, ypos, pxBrightness ]);
                if (pointData.length >= maxPoints) break;
            }

        }

    }

    return pointData;
}

// jb/apply-gradient
function applyGradient(p, config, ctx) {
    var palette = config.palette;

    if (!palette) return;

    var width = config.width || window.innerWidth;
    var height = config.height || window.innerHeight;

    var xRect = width / 2;
    var yRect = height / 2;

    var rotation1 = p.map(50, 0, 100, 0, width);
    var rotation2 = p.map(50, 0, 100, 0, height);
    var location = p.map(0, 50, 100, 0, width);

    var startGrad1 = p.createVector(xRect + rotation1 + location, yRect + height - rotation2 - location);
    var endGrad1 = p.createVector(xRect + width - rotation1 - location, yRect + rotation2 + location);

    //Main gradient
    p.blendMode(OVERLAY);
    if (ctx) {
        var gradient = ctx.createLinearGradient(startGrad1.x, startGrad1.y, endGrad1.x, endGrad1.y);
        gradient.addColorStop(0, palette[0]);
        gradient.addColorStop(1, palette[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    p.blendMode(BLEND);
}

// jb/draw-logo
//var LOGO_PX_SIDE = 60;
//var LOGO_PX_SHIFT = -50;

function putLogoAt(ctx, image, x, y) {
    ctx.drawImage(image, x - 870 / 2, y - 55, 870, 110);
}

function drawLogo(p, logo, ctx) {
    if (!logo || !logo.product) return;
    var productId = logo.product;
    var imagePath = 'logos/' + productId + '-text-square.svg';
    if (productsImages[productId] && ctx) {
        putLogoAt(ctx, productsImages[productId], logo.x * width, logo.y * height);
    }
}
