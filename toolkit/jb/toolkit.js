Rpd.channeltype('jb/config', {
    show: function(cfg) { return cfg ? '[Config]' : '[No Config]'; }
});

Rpd.channeltype('jb/image', {
    show: function(img) { return img ? '[Image]' : '[No Image]'; }
});

Rpd.channeltype('jb/integer', {
    allow: [ 'util/number' ],
    default: 0,
    readonly: true,
    accept: function(val) {
        if (val === Infinity) return true;
        var parsed = parseFloat(val);
        return !isNaN(parsed) && isFinite(parsed);
    },
    adapt: function(val) { return Math.floor(parseFloat(val)); }
});

Rpd.channeltype('jb/palette', { show: howMuch('color', 'colors') });
Rpd.channeltype('jb/logo', { show: function(logo) { return logo.product + ', ' + logo.x + ', '+ logo.y; } });

Rpd.channeltype('jb/product', { });

var PIXELS_COUNT_FACTOR = 4; // one pixel is four elements in the array
Rpd.channeltype('jb/pixels', {
    show: function(value) {
        if (!value) return '<None>';
        return value.width + 'x' + value.height + ', ' +
            ((value.pixels && value.pixels.length)
             ? (Math.floor(value.pixels.length / PIXELS_COUNT_FACTOR / 100) / 10) + 'kpx'
             : '0px');
    }
});

Rpd.nodetype('jb/config', {
    inlets: {
        'bang': { type: 'util/bang' },
        'width': { type: 'jb/integer', 'default': window.innerWidth },
        'height': { type: 'jb/integer', 'default': window.innerHeight },
        'srcPixels': { type: 'jb/pixels', 'default': null },
        'bgcolor': { type: 'util/color', 'default': _rgb(24, 24, 24) },
        'palette': { type: 'jb/palette' },
        'logo': { type: 'jb/logo' },
        'maxSquareSize': { type: 'jb/integer', 'default': 15, name: 'squareSize' },
        'density': { type: 'util/number', 'default': 6 },
        'chaos': { type: 'util/number', 'default': 0.5 },
        'step': { type: 'jb/integer', 'default': 16 }
    },
    outlets: {
        'config': { type: 'jb/config' }
    },
    process: function(inlets) {
        return {
            config: inlets
        };
    }
});

Rpd.nodetype('jb/preview', {
    inlets: {
        config: { type: 'jb/config', 'default': {} }
    },
    outlets: {
        image: { type: 'jb/image', 'default': null }
    },
    process: function(inlets) {
        window.updateSketchConfig(inlets.config);
        return { image: {} };
    }
});


Rpd.nodetype('jb/logo', {
    inlets: {
        product: { type: 'jb/product', 'default': '' },
        x: { type: 'util/number', 'default': 0.5 },
        y: { type: 'util/number', 'default': 0.5 }

    },
    outlets: {
        out: { type: 'jb/logo', 'default': null }
    },
    process: function(inlets) {
        return { out: inlets };
        //return { out: { x: inlets.x, y: inlets.y, logo: inlets.logo } };
    }
});

var pxDensity = 1;
Rpd.nodetype('jb/rorschach', {
    inlets: {
        'pixels': { type: 'jb/pixels' }
    },
    outlets: {
        'pixip': { type: 'jb/pixels' }
    },
    process: function(inlets) {
        if (!inlets.pixels) return; // FIXME: why this condition needed?
        var width =  inlets.pixels.width*pxDensity * 4;
        var height = inlets.pixels.height*pxDensity;
        var temp = inlets.pixels;
        var pixls = inlets.pixels.pixels;


        for (var i = 0; i < height; i+=1) {
            for (var j = 0; j < width/2; j+=1) {
                pixls[(i+1)*width - j - 2] = pixls[i*width + j];

            }
        }

         temp.pixels = pixls;
        return { 'pixip': temp };
    }


});


// FIXME: setting type to 'core/bool' causes "cannot set '.hidden' to undefined"
// FIXME: Error: outlet/error — Outlet of type 'util/bang' is not allowed to connect to inlet of type 'jb/boolean'
/* Rpd.nodetype('jb/image', {
    inlets: {
        file: { type: 'core/any', hidden: true },
    },
    outlets: {
        forms: { type: 'jb/forms' }
    },
    process: function(inlets) {
        var file = inlets.file;
        return {
            forms: file
                ? [ function(p) {
                    //p.image(maybeCachedImage(p, file).hide(), 0, 0, 300, 300);
                } ]
                : []
        }
    }
});
 */

 Rpd.nodetype('jb/save', {
    inlets: { 'image': { type: 'jb/image' } },
    process: function() {}
});

Rpd.nodetype('jb/palette', {
    inlets: {
        'palette': { type: 'jb/palette', default: PRODUCTS[0].palette, label: 'selection', hidden: true },
        'product': { type: 'jb/product', default: PRODUCTS[0].id, label: 'product', hidden: true },
    },
    outlets: {
        'palette': { type: 'jb/palette' },
        'product': { type: 'jb/product' }
    },
    process: function(inlets) {
        return {
            palette: inlets.palette,
            product: inlets.product
        };
    }
});

var EMPTY_PIXELS = {
  width: 0,
  height: 0,
  pixels: [],
  step: 10,
    seed: -1,
    density: -1,
    time: -1
};
Rpd.nodetype('jb/noise', function() {

    var refreshSketch;
    //var values = Kefir.emitter();

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
        refreshSketch = function(inlets) {
            if (!setupCalled) return;
            p.noiseDetail(inlets.lod, inlets.falloff);
            var lastSeed = p.random(1000);
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
            for (x = 0; x < width; x+=10) {
                //var column = [];
                for (y = 0; y < height; y+=10) {
                    c = 255 * p.noise(0.005 * x, 0.005 * y);
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
                pixels: p.pixels,
                //values: lastValues,
                step: 10,
                time: new Date(),
                density: p.pxDensity,
                seed: lastSeed
            };
        };
    };

    var noiseP5 = new p5(noiseSketch);

  // console.log(noiseP5);

    return {
        inlets: {
            'bang': { type: 'util/bang' },
            'lod': { type: 'util/number' },
            'falloff': { type: 'util/number' }

        },
        outlets: { 'pixels': { type: 'jb/pixels' } },
        process: function(inlets) {
            return {
                pixels: refreshSketch ? refreshSketch(inlets) : EMPTY_PIXELS
            }
        }
    };
});
