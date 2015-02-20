/**
 * Created by tom on 2/8/15.
 */
var termToRgb = function(term) {
  var r, g, b;
  if (term > 231) {
    r = 8 + (term - 232) * 10;
    g = r;
    b = r;
  } else if (term > 15) {
    b = Math.max(0, (term - 16) % 6);
    g = Math.max(0, (term - 16 - b) / 6 % 6);
    r = Math.max(0, (term - 16 - b - 6 * g) / 36);
    r *= 51;
    g *= 51;
    b *= 51;
  } else if (term == 7) {
    r = 0xC0;
    g = 0xC0;
    b = 0xC0;
  } else if (term == 8){
    r = 0x80;
    g = 0x80;
    b = 0x80;
  } else {
    var bits = ('0000' + term.toString(2)).slice(-4).split('');
    r = parseInt(bits[3]) * 0x80 + parseInt(bits[0]) * 0x7F;
    g = parseInt(bits[2]) * 0x80 + parseInt(bits[0]) * 0x7F;
    b = parseInt(bits[1]) * 0x80 + parseInt(bits[0]) * 0x7F;
  }
  return [r,g,b];
};

var rgbToHex = function(r,g,b){
  if (g == undefined && b == undefined && Array.isArray(r)){
    b = r[2];
    g = r[1];
    r = r[0];
  }
  return r<<16|g<<8|b;
};

var hexToRgb = function(colHex){
  return [(colHex & 0xFF0000)>>16, (colHex & 0xFF00)>>8, (colHex & 0xFF)];
};

var luminance = function(colHex){
  var constants = [0,0,0];
  var col = hexToRgb(colHex);
  for (var i = 0; i < 3; i++){
    constants[i] = ((col[i]/255) <= 0.03928 ? (col[i]/255)/12.92 : Math.pow(((col[i]/255)+0.055)/1.055, 2.4))
  }
  return 0.2126 * constants[0] + 0.7152 * constants[1] + 0.0722 * constants[2]
};

var contrastRatio = function(col1, col2){
  var l1 = luminance(col1);
  var l2 = luminance(col2);
  if (l1 > l2) {
    return (l1 + 0.05) / (l2 + 0.05);
  } else {
    return (l2 + 0.05) / (l1 + 0.05);
  }
};

var noBlue = function(col){
  return col & 0xFFFF00;
};

var blend = function(foregroundColor, backgroundColor, transparency){
  var fg = transparency;
  var bg = 1 - transparency;
  return Math.floor(((foregroundColor & 0xFF0000) >> 16) * fg + ((backgroundColor & 0xFF0000) >> 16) * bg) << 16 |
         Math.floor(((foregroundColor & 0xFF00  ) >> 8 ) * fg + ((backgroundColor & 0xFF00  ) >> 8 ) * bg) << 8  |
         Math.floor(((foregroundColor & 0xFF    )      ) * fg + ((backgroundColor & 0xFF    )      ) * bg)
};

var hexPad = function(hex, width){
  return ((new Array(width+1)).join('0') + hex.toString(16)).slice(-width)
};

var decPad = function(dec, width){
  return ((new Array(width+1)).join('0') + dec.toString(10)).slice(-width)
};

var go = function(){
  var termAlpha = 0.7;
  var bgA = 0xFFFFFF;
  var bgB = 0x000000;
  var fg, bg, color, textColor, crw, crb, crwf, crbf, $td;
  var $table = $('<table>');
  var $thead = $('<thead>');
  var $tr = $('<tr>');
  for (bg = 0; bg < 256; bg++){
    color = rgbToHex(termToRgb(bg));
    if (luminance(color) >= 0.4) {
      textColor = 0x000000;
    } else {
      textColor = 0xFFFFFF;
    }
    $tr.append($('<th style="color: #' + hexPad(textColor,6) + '; background-color: #' + hexPad(color,6) + ';">' + decPad(bg,3) + '</th>'));
  }
  $thead.append($tr);
  $table.append($thead);
  var $tbody = $('<tbody>');
  for (fg = 0; fg < 256; fg++){
    textColor = rgbToHex(termToRgb(fg));
    $tr = $('<tr style="color: #' + hexPad(textColor,6) + ';"></tr>');
    for (bg = 0; bg < 256; bg++){
      color = rgbToHex(termToRgb(bg));
      crw = contrastRatio(textColor, blend(color, bgA, 0.7));
      crb = contrastRatio(textColor, blend(color, bgB, 0.7));
      crwf = contrastRatio(noBlue(textColor), noBlue(blend(color, bgA, termAlpha)));
      crbf = contrastRatio(noBlue(textColor), noBlue(blend(color, bgB, termAlpha)));
      $td = $('<td style="background-color: #' + hexPad(color,6) + ';"></td>');
      if (crw >= 4 && crb >= 4 && crwf >= 4 && crbf >= 4){
        $td.text((Math.floor(crw * 10)/10).toString() + '\n' + (Math.floor(crb * 10)/10).toString() + '\n' + (Math.floor(crwf * 10)/10).toString() + '\n' + (Math.floor(crbf * 10)/10).toString()) ;
      }
      $tr.append($td);
    }
    $tbody.append($tr);
  }
  $table.append($tbody);
  $('#container').append($table);
};

var rgbToHsl = function(r, g, b){
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
    h = s = 0; // achromatic
  }else{
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.floor(h*100)/100, Math.floor(s*100)/100, Math.floor(l*100)/100];
};

var closestPrimary = function(colRgb){
  var primaries = [0, 1/12, 1/6, 1/3, 2/3, 5/6];
  var names = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  var hsl = rgbToHsl(colRgb[0], colRgb[1], colRgb[2]);
  var dist = new Array(6);
  for (var i = 0; i < 6; i++){
    dist[i] = Math.abs(hsl[0] - primaries[i]);
  }
  var min = Math.min.apply(null, dist);
  return names[dist.indexOf(min)];
};

var sortfunc = function(a, b){
  if (a[11] < b[11]){
    return -1;
  } else if (a[11] > b[11]){
    return 1;
  } else {
    if (a[12] < b[12]){
      return 1;
    } else if (a[12] > b[12]){
      return -1;
    } else {
      if (a[13] < b[13]){
        return -1;
      } else if (a[13] > b[13]){
        return 1;
      } else {
        return 0;
      }
    }
  }
};

var go2 = function(){
  var target = 3.2;
  var $table = $('<table><thead><tr><th></th><th colspan="2">Normal</th><th colspan="2">Flux</th></tr>' +
                 '<tr><th>Index</th><th>Black</th><th>White</th><th>Black</th><th>White</th></tr></thead></table>');
  var $tbody = $('<tbody>');
  var termBg = rgbToHex(termToRgb(0));
  var termAlpha = 0.7;
  var background1 = 0x000000;
  var background2 = 0xFFFFFF;
  var $tr, col, colHex, fluxColHex, bg1, bg2, bg3, bg4, cr1, cr2, cr3, cr4, hsl, primary, i, row;
  var results = [];
  for (i = 0; i < 256; i++) {
    col = termToRgb(i);
    colHex = rgbToHex(col);
    fluxColHex = noBlue(colHex);
    bg1 = blend(termBg, background1, termAlpha);
    bg2 = blend(termBg, background2, termAlpha);
    bg3 = noBlue(bg1);
    bg4 = noBlue(bg2);
    cr1 = contrastRatio(colHex, bg1);
    cr2 = contrastRatio(colHex, bg2);
    cr3 = contrastRatio(fluxColHex, bg3);
    cr4 = contrastRatio(fluxColHex, bg4);
    hsl = rgbToHsl(col[0], col[1], col[2]);
    primary = closestPrimary(col);
    if(cr1 >= target && cr2 >= target && cr3 >= target && cr4 >= target){//} && hsl[1] == 1) {
      results.push([
        i,
        hexPad(colHex, 6),
        hexPad(bg1, 6),
        Math.floor(cr1 * 10) / 10,
        hexPad(bg2, 6),
        Math.floor(cr2 * 10) / 10,
        hexPad(fluxColHex, 6),
        hexPad(bg3, 6),
        Math.floor(cr3 * 10) / 10,
        hexPad(bg4, 6),
        Math.floor(cr4 * 10) / 10,
        hsl[0],
        hsl[1],
        hsl[2],
        primary
      ]);
    }
  }
  results = results.sort(sortfunc);
  for (i = 0; i < results.length; i++){
    row = results[i];
    $tr = $('<tr>');
    $tr.append($('<td>'+row[0]+'</td>'));
    $tr.append($('<td style="color: #' + row[1] + '; background-color: #' + row[2] + ';">' + row[3] + '</td>'));
    $tr.append($('<td style="color: #' + row[1] + '; background-color: #' + row[4] + ';">' + row[5] + '</td>'));
    $tr.append($('<td style="color: #' + row[6] + '; background-color: #' + row[7] + ';">' + row[8] + '</td>'));
    $tr.append($('<td style="color: #' + row[6] + '; background-color: #' + row[9] + ';">' + row[10] + '</td>'));
    $tr.append($('<td>'+row[11]+'</td>'));
    $tr.append($('<td>'+row[12]+'</td>'));
    $tr.append($('<td>'+row[13]+'</td>'));
    $tr.append($('<td>'+row[14]+'</td>'));
    $tbody.append($tr);
  }
  $table.append($tbody);
  $('#container').append($table);
};

$(function(){
  go2();

  //var $ol = $('<ul>');
  //var color, textColor, colorHex;
  //for (var i = 0; i < 256; i++){
  //  color = termToRgb(i);
  //  colorHex = rgbToHex(color);
  //  if (luminance(colorHex) >= 0.4) {
  //    textColor = 0x000000;
  //  } else {
  //    textColor = 0xFFFFFF;
  //  }
  //  $ol.append($('<li style="color: #' + hexPad(textColor,6) + '; background-color: #' + hexPad(colorHex, 6) + ';">#' + hexPad(colorHex, 6) +'</li>'))
  //}
  //$('#container').append($ol);
});