var UTF8LengthSplit;

UTF8LengthSplit = function(str, len) {
  var UTF8l, i, j, k, segA, segB, temp;
  temp = [str];
  i = 0;
  while (i < temp.length) {
    UTF8l = 0;
    j = 0;
    while (j < temp[i].length) {
      k = temp[i].charCodeAt(j);
      if (k < 0x7F) {
        UTF8l += 1;
      } else if (k < 0x7ff) {
        UTF8l += 2;
      } else if (k < 0xFFFF) {
        UTF8l += 3;
      } else {
        UTF8l += 4;
      }
      if (UTF8l > len) {
        segA = temp[i].substring(0, j);
        segB = temp[i].substring(j);
        temp.splice(i, 1, segA, segB);
      }
      j++;
    }
    i++;
  }
  return temp;
};

module.exports = {
  UTF8LengthSplit: UTF8LengthSplit
};
