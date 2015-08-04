var rgbToHsv = function(r,g,b) {
  var min, max, delta, h, s, v;
  r = r / 255;
  g = g / 255;
  b = b / 255;
  min = Math.min(r,g,b);
  max = Math.max(r,g,b);
  v = max;
  delta = max - min;
  if (max != 0) {
    s = delta/max;
  } else {
    s = 0;
    h = 0;
    return [h,s,v];
  }
  if (r == max) {
    h = (g - b) / delta;
    if (h < 0) h += 6;
  } else if (g == max) {
    h = 2 + ( b - r ) / delta;
  } else {
    h = 4 + ( r - g ) / delta;
  }
  return [h*60,s,v];
};

var Color = function(r,g,b,n){
  return {
    r: r,
    g: g,
    b: b,
    n: n,
    get hex() {return ('000000' + (this.r << 16 | this.g << 8 | this.b).toString(16)).slice(-6);},
    get h() {return rgbToHsv(this.r, this.g, this.b)[0];},
    get s() {return rgbToHsv(this.r, this.g, this.b)[1];},
    get v() {return rgbToHsv(this.r, this.g, this.b)[2];},
    get y() {return 0.2126 * this.r / 255 + 0.7152 * this.g / 255 + 0.0722 * this.b / 255;},
    makeRow: function(){
      var row = $('<tr>');
      row.append($('<td>').text(this.n));
      row.append($('<td style="background-color: #' + this.hex + ';"></td>'));
      row.append($('<td>').text(this.hex));
      row.append($('<td>').text(this.r));
      row.append($('<td>').text(this.g));
      row.append($('<td>').text(this.b));
      row.append($('<td>').text(this.h));
      row.append($('<td>').text(this.s));
      row.append($('<td>').text(this.v));
      row.append($('<td>').text(Math.floor(ya * (this.y + yb))));
      return row;
    }
  };
};

var termColor = function(n){
  var r, g, b;
  if (n > 255 || n < 0) {
    throw "Index out of range";
  } else if (n > 231) {
    r = g = b = Math.floor(8 + (n - 232)*10);
  } else if (n > 15) {
    r = Math.floor((n-16)/36) > 0 ? Math.floor((n - 16) / 36) * 40 + 55: 0;
    g = Math.floor(((n - 16) % 36) / 6) > 0 ? Math.floor(((n - 16) % 36) / 6) * 40 + 55 : 0;
    b = Math.floor((n - 16) % 6) > 0 ? Math.floor((n - 16) % 6) * 40 + 55 : 0;
  } else if (n == 8) {
    r = g = b = 128;
  } else if (n == 7) {
    r = g = b = 192;
  } else {
    r = (128 * (n & 1) + 127 * ((n & 8) >> 3));
    g = (128 * ((n & 2) >> 1) + 127 * ((n & 8) >> 3));
    b = (128 * ((n & 4) >> 2) + 127 * ((n & 8) >> 3));
  }
  return Color(r,g,b,n);
};

var colors = [];
for (var i = 0; i < 256; i++){
  colors.push(termColor(i));
}

ignore = [1,2,3,4,5,6,9,10,11,12,13,14];

colors = _.filter(colors,function(color){
  return (!(color.r == color.g && color.r == color.b))
         && (ignore.indexOf(color.n) == -1)
         //&& ( color.v < 0.5 && color.s == 1)
         && (color.h == 300)
  ;
});

var miny = Math.min.apply(null,_.map(colors,function(color){return color.y;}));
var maxy = Math.max.apply(null,_.map(colors,function(color){return color.y;}));
var dify = maxy-miny;
var yb = -miny;
var ya = 8/dify;

var sort3 = function(a,b){
  if (Math.floor(ya * (a.y + yb)) < Math.floor(ya * (b.y + yb))){
    return -1;
  } else if (Math.floor(ya * (a.y + yb)) > Math.floor(ya * (b.y + yb))){
    return 1;
  } else {
    if (a.h < b.h){
      return -1;
    } else if (a.h > b.h){
      return 1;
    } else {
      return 0;
    }
  }
};

var sort2 = function(a,b){
  var mina = Math.min(a.s, a.v);
  var minb = Math.min(b.s, b.v);
  if (mina < minb){
    return -1;
  } else if (mina > minb){
    return 1;
  } else {
    if (a.h < b.h){
      return -1;
    } else if (a.h > b.h){
      return 1;
    } else {
      return 0;
    }
  }
};

var sort1 = function(a,b){
  if (a.h < b.h){
    return -1;
  } else if (a.h > b.h){
    return 1;
  } else {
    if (a.v < b.v){
      return -1;
    } else if (a.v > b.v){
      return 1;
    } else {
      if (a.s < b.s){
        return 1;
      } else if (a.s > b.s){
        return -1;
      } else {
        return 0;
      }
    }
  }
};

colors = colors.sort(sort1);

$(function(){
  var table = $('<table>');
  var thead = $('<thead>');
  var tr = $('<tr>');
  tr.append($('<th>').text('N'));
  tr.append($('<th>').text('Color'));
  tr.append($('<th>').text('Hex'));
  tr.append($('<th>').text('R'));
  tr.append($('<th>').text('G'));
  tr.append($('<th>').text('B'));
  tr.append($('<th>').text('H'));
  tr.append($('<th>').text('S'));
  tr.append($('<th>').text('V'));
  tr.append($('<th>').text('Y'));
  thead.append(tr);
  table.append(thead);
  var tbody = $('<tbody>');
  for (i = 0; i < colors.length; i++){
    tr = colors[i].makeRow();
    tbody.append(tr);
  }
  table.append(tbody);
  $('#container').append(table);
});
