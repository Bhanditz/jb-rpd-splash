var sketchConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    maxPoints: 100000,
    scale: 1,
    bgcolor: _rgb(24, 24, 24),
    palette: [
        '#ff0000',
        '#00ff00',
        '#0000ff'
    ],
    maxSquareSize: 8,
    density: 6,
    irregularity: 0.5,
    step: 10,
    backImgSrc: 'http://localhost:8000/experiment_bg.png'
};

function loadChangedValuesFrom(newConfig) {
    Object.keys(newConfig).forEach(function(key) {
        if (newConfig[key]) sketchConfig[key] = newConfig[key];
    });
}

var backImg, grad, my;

var lastPoint;

var pointData = [];
var cvsPointData = [];

var lastBgImage;
var cvsPixels;
var canvas, ctx;

function preload() {
    loadImage(sketchConfig.backImgSrc, function(img) {
        img.loadPixels();
        lastBgImage = img;
        pointData = collectPointData(sketchConfig, img.pixels, img.width, img.height);
        console.log('image loaded');
        redraw();
        var loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = 0;
        }
    });

}

function setup() {


    var bgcolor = sketchConfig.bgcolor;
    background(color(bgcolor.r, bgcolor.g, bgcolor.b));
    clear();

    canvas = createCanvas(sketchConfig.width, sketchConfig.height).parent('rpd-jb-preview-target');
    ctx = canvas.drawingContext;
    noLoop();
    updateSketchConfig(sketchConfig);
}

function draw() {
    clear();
    var width = sketchConfig.width;
    var height = sketchConfig.height;

    noStroke();

    for (var x = 0; x <= width/2+10; x+=10) {
        for (var y = 0; y < height; y+=10) {
            var c = 255 * noise(0.005 * x, 0.005 * y);
            fill(c);
            rect(x, y, 10, 10);
            rect(width - x, y, 10, 10)

        }
    }


    loadPixels();

    cvsPixels = pixels;


    cvsPointData = collectPointData(sketchConfig, cvsPixels, width, height);


    fill(color('white'));
    stroke(color('red'));
    //noStroke();


    var xRect = width/2;
    var yRect = height/2;


    var rotation1 = map(50, 0, 100, 0, width);
    var rotation2 = map(50, 0, 100, 0, height);
    var location = map(0, 50, 100, 0, width);


    var startGrad1 = createVector(xRect + rotation1 + location, yRect + height - rotation2 - location);
    var endGrad1 = createVector(xRect + width - rotation1 - location, yRect + rotation2 + location);



    if (cvsPointData && cvsPointData.length) {


        var voronoi = d3.voronoi()
                        .size([width, height])
                        (cvsPointData);


        drawEdges(voronoi, sketchConfig);
        console.log('draw');
    }

    //rectangle
    blendMode(OVERLAY);
    if (ctx) {
        var gradient = ctx.createLinearGradient(startGrad1.x, startGrad1.y, endGrad1.x, endGrad1.y);
        gradient.addColorStop(0, sketchConfig.palette[0]);
        gradient.addColorStop(1, sketchConfig.palette[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    blendMode(BLEND);


    drawSquares(cvsPointData, sketchConfig);



}

function updateSketchConfig(newConfig) {

    var recalcPoints = (newConfig.irregularity || newConfig.maxPoints || newConfig.width || newConfig.height) ? true : false;
    loadChangedValuesFrom(newConfig);
    // if (recalcPoints && lastBgImage) {
    //     pointData = collectPointData(sketchConfig, lastBgImage.pixels, lastBgImage.width, lastBgImage.height);
    // }
    redraw();
}

function collectPointData(config, pixels, imgWidth, imgHeight) {
    //console.log(config);
    var step = Math.floor(config.step);
    var maxPoints = config.maxPoints;
    var inregularity = config.irregularity;

    var width = config.width;
    var height = config.height;

    var idx, pxBrightness, r, g, b, a;

    var lastPoint;

    var pointData = [];

    var xpos, ypos;

    //var d = pixelDensity();

    //console.log('maxPoints', maxPoints);

   // console.log('imgWidth', imgWidth, 'imgHeight', imgHeight, 'step', step);

    for (var x = 0; x < imgWidth; x += step) {

        if (pointData.length >= maxPoints) break;

        for (var y = 0; y < imgHeight; y += step) {

           // console.log('y', y, pointData.length >= maxPoints);

            if (pointData.length >= maxPoints) break;

            idx = pixelIndexByCoords(x, y, imgWidth, imgHeight);

            r = pixels[idx];
            g = pixels[idx+1];
            b = pixels[idx+2];
            a = pixels[idx+3];

            pxBrightness = brightness(color(r, g, b, a));

            //console.log('x', x, 'y', y, 'r', r, 'g', g, 'b', b, 'a', a, 'brightness', pxBrightness);

            if ((pxBrightness > 40)&&(random(0, pxBrightness)<30)) {

                xpos = ((x / imgWidth) * width) + (random(-step / 2, step / 2) * inregularity);
                ypos = ((y / imgHeight) * height) + (random(-step / 2, step / 2) * inregularity);

                pointData.push([ xpos, ypos, pxBrightness ]);
            }

        }

    }

    //console.log(pointData.length, pointData);

    return pointData;
}

function drawPolygons(voronoi, config) {
    var polygons = voronoi.polygons();

    var vcolors = [
                   color(197,27,125), color(222,119,174), color(241,182,218),
                   color(253,224,239), color(247,247,247), color(230,245,208),
                   color(184,225,134), color(127,188,65), color(77,146,33)
                  ];

    stroke(255);

    // draw polygons
    for (var j = 0; j < polygons.length; j++) {
        var polygon = polygons[j];

        if (!polygon) continue;

        // pick a random color
        var polyColor = vcolors[j % vcolors.length];
        fill(polyColor);

        beginShape();

        for (var k = 0; k < polygon.length; k++) {

          var v = polygon[k];
          vertex(v[0], v[1]);

        }

        endShape(CLOSE);
    }

    // draw circles.

    var circles = pointData.slice(1);

    stroke(0);
    for (var i = 0 ; i < circles.length; i++) {
        var center = circles[i];
        push();
        translate(center[0], center[1]);
        fill(0);
        ellipse(0, 0, 1.5, 1.5);
        pop();
    }

}

function drawEdges(voronoi, config) {



    strokeWeight(0.25);
    var myEdges = voronoi.edges; //myDelaunay.getEdges();

    for (var n=0; n<myEdges.length; n++) {
        if (!myEdges[n]) continue;
        var startX = myEdges[n][0][0];
        var startY = myEdges[n][0][1];
        var endX = myEdges[n][1][0];
        var endY = myEdges[n][1][1];

            gradientLine(startX, startY, endX, endY, '#ffffff', '#000000');



    }

}


function drawSquares(data, config) {

    var s = config.maxSquareSize;

    rectMode(CENTER);


    noStroke();
    for (var i = 0 ; i < data.length; i++) {
        var point = data[i];
        push();
        translate(point[0], point[1]);
        fill(255);
        var sqSize = map(point[2], 40, 100, 1, s);
        rect(0, 0, sqSize, sqSize);
        pop();
    }

}

function drawShapes(voronoi, config) {
    var edges = voronoi.edges;
    var cells = voronoi.cells;

    smooth();

    noStroke();

    //blendMode(SCREEN);
    var shapes = [];
   // int[] colors = {0xccd5df, 0x8da3b2, 0x6f899f, 0x3b5778, 0xd6dfe6};

    var s = 0;

    var minX, minY, maxX, maxY;

    var area;

    var cellEdges;
    var coords;

    var l;

    for (var j = 0; j < cells.length; j++) {
        if (!cells[j]) continue;
        cellEdges = cells[j].halfedges;

        minX = Infinity, minY = Infinity;
        maxX = 0, maxY = 0;

        coords = [];

        for (l = 0; l < cellEdges.length; ++l) {
            coords.push(edges[cellEdges[l]][0]);
            coords.push(edges[cellEdges[l]][1]);
        }

        for (l = 0; l < coords.length; ++l) {
            minX = Math.min(maxX, coords[l][0]);
            minY = Math.min(minY, coords[l][1]);
            maxX = Math.max(maxX, coords[l][0]);
            maxY = Math.max(maxY, coords[l][1]);
        }

        area = (maxX - minX) * (maxY - minY);

        if (area < 2000) {
            shapes.push(coords);
            s++;
        }

    }

    for (j = 0; j < shapes.length; j++) {
        if (!shapes[j]) continue;
        fill(color(random(255)), random(40, 80));
        beginShape();
        coords = shapes[j];
        for (var l = 0; l < coords.length; ++l) {
            vertex(coords[l][0], coords[l][1]);
        }
        endShape(CLOSE);
    }
}

function drawLines(voronoi) {

    var edges = voronoi.edges;
    var cells = voronoi.cells;

    var cellEdges;

    var l;


    for (var j = 0; j < cells.length; j++) {
        if (!cells[j]) continue;
        cellEdges = cells[j].halfedges;

        for (l = 0; l < cellEdges.length; l += 2) {
            if (!cellEdges[l] || !cellEdges[l + 1]) continue;

            startX = edges[cellEdges[l]][0];
            startY = edges[cellEdges[l]][1];
            endX = edges[cellEdges[l + 1]][0];
            endY = edges[cellEdges[l + 1]][1];

            strokeWeight(1);
            stroke(255);
            console.log('line',startX);

            line(startX, startY, endX, endY);
        }




    }

}

function gradientLine(x1, y1, x2, y2, color1, color2) {

    if(ctx) {
        // linear gradient from start to end of line
        var grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);

        ctx.strokeStyle = grad;


        line(x1, y1, x2, y2);
    }
}




function pixelIndexByCoords(x, y, width, height) {
    return (x + y * width) * 4;
}
