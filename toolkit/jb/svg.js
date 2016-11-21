var SVG_XMLNS = "http://www.w3.org/2000/svg";
var HTML_XMLNS = "http://www.w3.org/1999/xhtml";

var lastCvsId = 0;
Rpd.noderenderer('jb/render', 'svg', function() {
    var formsRef = {};
    var myP5;
    return {
        size: { width: 200, height: 200 },
        pivot: { x: 0, y: 0 },
        first: function(bodyElm) {
            var wrapperId = 'p5-canvas-' + lastCvsId;
            var wrapper = createCanvasWrapper(wrapperId, bodyElm);
            myP5 = new p5(initP5(formsRef), wrapper);
            lastCvsId++;
        },
        always: function(bodyElm, inlets) {
            formsRef.forms = inlets.forms;
            if (inlets.forms.length) myP5.redraw();
        }
    };
});

Rpd.noderenderer('jb/layers', 'svg', {
    size: { width: 150 }
});

Rpd.noderenderer('jb/modify', 'svg', {
    size: { width: 100 }
});

Rpd.noderenderer('jb/image', 'svg', function() {
    var myP5, lastFile;
    return {
        size: { width: 200, height: 200 },
        pivot: { x: 0, y: 0 },
        first: function(bodyElm) {
            var wrapperId = 'p5-canvas-' + lastCvsId;
            var wrapper = createCanvasWrapper(wrapperId, bodyElm);
            var node = this;
            myP5 = new p5(createP5ForImageDrop(node, 'file', function() { return lastFile; }), wrapper);
            myP5.redraw();
            lastCvsId++;
        },
        always: function(bodyElm, inlets) {
            if (inlets.file) {
                lastFile = inlets.file;
                myP5.redraw();
            }
        }
    };
});

function createCanvasWrapper(wrapperId, bodyElm) {
    var group = document.createElementNS(SVG_XMLNS, 'g');
    group.setAttributeNS(null, 'transform', 'translate(10, 10)');
    var foreign = document.createElementNS(SVG_XMLNS, 'foreignObject');
    var wrapper = document.createElementNS(HTML_XMLNS, 'div');
    wrapper.id = wrapperId;
    wrapper.className = 'p5-canvas';
    foreign.appendChild(wrapper);
    group.appendChild(foreign);
    bodyElm.appendChild(group);
    return wrapper;
}

function createP5ForImageDrop(node, inletName, getFile) {
    return function(p) {
        p.setup = function() { var c = p.createCanvas(180, 180);
                               c.drop(function(file) {
                                   if (file.type === 'image') {
                                       node.inlets[inletName].receive(file);
                                   }
                               });
                               c.style("visibility", "visible"); // FIXME: why needed?
                               p.background(100);
                               p.noLoop(); };
        p.draw = function() {
            p.fill(255);
            var file = getFile();
            if (file) {
                var image = maybeCachedImage(p, file);
                p.image(image, 0, 0, p.width, p.height);
            }
            p.noStroke();
            p.textSize(12);
            p.textAlign(p.CENTER);
            if (!file) {
                p.text('Drag an image file\nonto the canvas.', p.width/2, p.height/2);
            } else {
                p.text(file.name, p.width/2, p.height/2);
            }
        };
    }
}
