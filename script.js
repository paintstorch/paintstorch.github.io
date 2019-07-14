//Canvas
let canvas          = document.getElementById('canvas');
let ctx             = canvas.getContext('2d');
let c_canvas        = document.getElementById('circle');
let c_ctx           = c_canvas.getContext('2d');

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

//checkbox
let checkbox       = [$('#PaperRS'), $('#CustomSS'), $('#CustomSD')];
let model          = 'PaperRS';

for(let i=0; i < checkbox.length; i++) {
  let check = checkbox[i];
  let value = check.val();

  check.click(function() {
    for(let j=0; j < checkbox.length; j++) {
      if(j != i) { checkbox[j].prop('checked', false); }
      else {
        model = value;
        check.prop('checked', true);
      }
    }

    post();
  });
}

//variables
let canvas_pos     = {'x': $(canvas).offset().left, 'y': $(canvas).offset().top};
let last_mouse_pos = {'x': 0, 'y': 0};
let mouse_pos      = {'x': 0, 'y': 0};
let paint          = false;
let tooltype       = 'draw';
let color          = '#000000';
let size           = 5;
let filename       = 'filename';

//RGB to Hex
cToHex = function (c) {
  let hex = Number(c).toString(16);
  if (hex.length < 2) { hex = "0" + hex; }
  return hex;
}

rgbaToHex = function(r, g, b, a) {
  if (a == 0) return 'ffffff';

  r = cToHex(r);
  g = cToHex(g);
  b = cToHex(b);
  return r + g + b;
}

//Post
post = function() {
  let sketch  = $('#hint-img').attr('src');
  let hint    = canvas.toDataURL();
  let opacity = 1.0;
  let data    = {
    'sketch' : sketch,
    'hint'   : hint,
    'opacity': opacity,
    'model'  : model
  };
  data        = JSON.stringify(data);

  $.ajax({
    url         : 'https://dvic.devinci.fr/dgx/paints_torch/api/v1/colorizer',
    type        : 'POST',
    data        : data,
    contentType : 'application/json; charset=utf-8',
    dataType    :'json',
    success     : function(response){
      if('colored' in response) {
        $('#colored-img').attr('src', response.colored);
      }
    }
  })
}

//Mousepos
elePos = function(ele) {
  let dx = ele.offsetLeft;
  let dy = ele.offsetTop;

  while (ele.offsetParent) {
    ele = ele.offsetParent;
    dx += ele.offsetLeft;
    dy += ele.offsetTop;
  }

  return { 'dx': dx, 'dy': dy };
}

getMousePos = function(e) {
  let offset = elePos(canvas);

  return {
      x: parseInt(e.clientX - offset.dx),
      y: parseInt(e.clientY - offset.dy)
  };
}

getTouchPos = function(e) {
  let offset = elePos(canvas);
  
  return {
      x: parseInt(e.targetTouches[0].clientX - offset.dx),
      y: parseInt(e.targetTouches[0].clientY - offset.dy)
  };
}

//Touchstart
$(canvas).on('touchstart', function(e){
  let pos          = getTouchPos(e);
  last_mouse_pos.x = pos.x;
  last_mouse_pos.y = pos.y;
  paint            = true;
});

//Mousedown
$(canvas).on('mousedown', function(e) {
  let pos          = getMousePos(e);
  last_mouse_pos.x = mouse_pos.x = pos.x;
  last_mouse_pos.y = mouse_pos.y = pos.y;
  paint            = true;
});

//Touchend
$(canvas).on('touchend', function(e){
  paint = false;
  if(tooltype != 'eye-dropper') { post(); }
  else {
    let pos = getTouchPos(e);
    let p   = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    let c   = '#' + rgbaToHex(p[0], p[1], p[2], p[3]);
    set_color_hex(c);
  }
});
$(canvas).on('touchcancel', function(e){
  paint = false;
  if(tooltype != 'eye-dropper') { post(); }
  else {
    let pos = getTouchPos(e);
    let p   = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    let c   = '#' + rgbaToHex(p[0], p[1], p[2], p[3]);
    set_color_hex(c);
  }
});

//Mouseup
$(canvas).on('mouseup', function(e) {
  paint = false;
  if(tooltype != 'eye-dropper') { post(); }
  else {
    let pos = getMousePos(e);
    let p   = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    let c   = '#' + rgbaToHex(p[0], p[1], p[2], p[3]);
    set_color_hex(c);
  }
});

//Touchmove
$(canvas).on('touchmove', function(e) {
  e.preventDefault();

  let pos     = getTouchPos(e);
  mouse_pos.x = pos.x;
  mouse_pos.y = pos.y;

  redraw_circle();

  if (paint && tooltype != 'eye-dropper') {
    ctx.beginPath();

    ctx.globalCompositeOperation = (tooltype == 'draw')? 'source-over': 'destination-out';
    ctx.strokeStyle              = (tooltype == 'draw')? color: null;
    ctx.lineWidth                = size;

    ctx.moveTo(last_mouse_pos.x, last_mouse_pos.y);
    ctx.lineTo(mouse_pos.x, mouse_pos.y);
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.stroke();
  }

  last_mouse_pos.x = mouse_pos.x;
  last_mouse_pos.y = mouse_pos.y;
});

//Mousemove
$(canvas).on('mousemove', function(e) {
  let pos     = getMousePos(e);
  mouse_pos.x = pos.x;
  mouse_pos.y = pos.y;

  redraw_circle();

  if (paint && tooltype != 'eye-dropper') {
    ctx.beginPath();

    ctx.globalCompositeOperation = (tooltype == 'draw')? 'source-over': 'destination-out';
    ctx.strokeStyle              = (tooltype == 'draw')? color: null;
    ctx.lineWidth                = size;

    ctx.moveTo(last_mouse_pos.x, last_mouse_pos.y);
    ctx.lineTo(mouse_pos.x, mouse_pos.y);
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.stroke();
  }

  last_mouse_pos.x = mouse_pos.x;
  last_mouse_pos.y = mouse_pos.y;
});

redraw_circle = function() {
  c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);
  c_ctx.beginPath();
  c_ctx.strokeStyle = '#000000';

  if(tooltype == 'eye-dropper') {
      let step = 5;

      c_ctx.moveTo(last_mouse_pos.x - step, last_mouse_pos.y);
      c_ctx.lineTo(last_mouse_pos.x + step, last_mouse_pos.y);

      c_ctx.moveTo(last_mouse_pos.x, last_mouse_pos.y - step);
      c_ctx.lineTo(last_mouse_pos.x, last_mouse_pos.y + step);

      c_ctx.rect(last_mouse_pos.x, last_mouse_pos.y, step * 2, step * 2);

      let p           = ctx.getImageData(last_mouse_pos.x, last_mouse_pos.y, 1, 1).data;
      c_ctx.fillStyle = '#' + rgbaToHex(p[0], p[1], p[2], p[3]);
      c_ctx.fill();
  }
  else { c_ctx.arc(mouse_pos.x, mouse_pos.y, size, 0, 2 * Math.PI); }

  c_ctx.stroke();
}


//Use draw|erase|eye-dropper
use_tool = function(tool) {
  tooltype = tool;

  switch (tool) {
    case 'draw':
      $('#brush').addClass('selected');
      $('#eraser').removeClass('selected');
      $('#eye-dropper').removeClass('selected');
      break;
    case 'eraser':
      $('#eraser').addClass('selected');
      $('#brush').removeClass('selected');
      $('#eye-dropper').removeClass('selected');
      break;
    case 'eye-dropper':
      $('#eraser').removeClass('selected');
      $('#brush').removeClass('selected');
      $('#eye-dropper').addClass('selected');
      break;
  }
}

//Reset
reset = function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  post();
}

//Set color
set_color_hex = function(value) {
  color = value;
  $('#color').css('background-color', color);
}

set_color = function(picker) {
  set_color_hex(picker.value);
}

//Set size
set_size = function(value) {
  size = value;
  switch(value) {
    case 2:
      $('#size_2').addClass('selected');
      $('#size_5').removeClass('selected');
      $('#size_10').removeClass('selected');
      $('#size_15').removeClass('selected');
      break;
    case 5:
      $('#size_2').removeClass('selected');
      $('#size_5').addClass('selected');
      $('#size_10').removeClass('selected');
      $('#size_15').removeClass('selected');
      break;
    case 10:
      $('#size_2').removeClass('selected');
      $('#size_5').removeClass('selected');
      $('#size_10').addClass('selected');
      $('#size_15').removeClass('selected');
      break;
    case 15:
      $('#size_2').removeClass('selected');
      $('#size_5').removeClass('selected');
      $('#size_10').removeClass('selected');
      $('#size_15').addClass('selected');
      break;
  }
}

//Save & Open
open_file = function(input) {
  if (input.files && input.files[0]) {
        var reader    = new FileReader();
        reader.onload = function (e) {
          let img    = new Image();

          img.onload = function() {
            let w         = this.width;
            let h         = this.height;
            let s         = 648 / Math.max(w, h);

            w             = parseInt(w * s);
            h             = parseInt(h * s);
            canvas.width  = w;
            canvas.height = h;

            $('#hint').css('width', w + 'px');
            $('#hint').css('height', h + 'px');

            $('#hint-img').css('width', w + 'px');
            $('#hint-img').css('height', h + 'px');
            $('#hint-img').attr('src', e.target.result);

            $('#canvas').attr('width', w);
            $('#canvas').attr('height', h);
            $('#canvas').css('width', w + 'px');
            $('#canvas').css('height', h + 'px');

            $('#colored').css('width', w + 'px');
            $('#colored').css('height', h + 'px');

            $('#colored-img').css('width', w + 'px');
            $('#colored-img').css('height', h + 'px');
            $('#colored-img').attr('src', e.target.result);

            $('#draw').css('display', 'flex');

            reset();
          }
          img.src  = e.target.result;
        };

        reader.readAsDataURL(input.files[0]);
        filename = input.files[0].name.split('.')[0];
    }
}

save_file = function() {
  let a = document.createElement('a');
  a.setAttribute('download', filename + '_colored.png');
  a.setAttribute('href', $('#colored-img').attr('src'));
  a.click();
}

save_hint = function() {
  let a = document.createElement('a');
  a.setAttribute('download', filename + '_hint.png');
  a.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
  a.click();
}
