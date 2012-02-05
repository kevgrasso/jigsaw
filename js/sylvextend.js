//Extends the functionality of Sylvester. If we need faster, we'll roll our own
//(check http://blog.tojicode.com/2010/06/stupidly-fast-webgl-matricies.html )
//or change Sylvester to 2D

//Creates Vector with given angle and length
Vector.Angle = function (theta, len) {
 return (Vector.create([len*Math.cos(theta), len*Math.sin(theta)]))
};
//returns Vector's angle in radians
Vector.prototype.getRadians = function () {
 return Math.atan2(this.elements[1], this.elements[0]);
};
//returns Vector's angle in degrees
Vector.prototype.getDegrees = function () {
 return this.getRadians()*180/Math.PI
};
Vector.prototype.getSlope = function () {
 return this.elements[1]/this.elements[0]
}
//returns x coordinate
Vector.prototype.getX = function () {
 return this.elements[0];
};
//returns y coordinate
Vector.prototype.getY = function () {
 return this.elements[1];
};
//returns perpendicular of current Vector
Vector.prototype.perp = function () {
	return Vector.create([this.elements[0], -this.elements[1]]);
};
//returns vector rotated to given angle
Vector.prototype.toAngle = function (theta) {
 var mod = this.modulus();
 return (Vector.create([mod*Math.cos(theta), mod*Math.sin(theta)]))
};
//returns Vector sized to given length
Vector.prototype.toMagnitude = function (len) {
 var theta = this.getRadians();
 return (this.toUnitVector().multiply(len))
};

//creates Identity Matrix
Matrix.Identity = Matrix.I;

//creates scale matrix of size n and scale varargs
Matrix.Scale = function(n) {
var els = [], k = n, i, nj, j, s = [];
if (n>1 && arguments.length<3) {
 do {
  s.push(arguments[1]);
 } while (--n)
} else {
 do {
  s.push(arguments[n]);
 } while (--n)
 s.reverse();
} n = k;
do { i = k - n;
 els[i] = []; nj = k;
 do { j = k - nj;
   els[i][j] = (i == j) ? s[i] : 0;
 } while (--nj);
} while (--n);
return Matrix.create(els);
};

//creates shear matrix
Matrix.Shear = function (n, x, y) {
 var S = Matrix.I(n);
 S[0][1] = y;
 S[1][0] = x;
 return S;
};

//returns matrix scaled by given params
Matrix.prototype.scale = function () {
 return this.multiply(Matrix.Scale.apply(null,
  [this.elements.length].concat(
  Array.prototype.slice.call(arguments))));
};

//returns matrix sheared by given params
Matrix.prototype.shear = function (x, y) {
 return this.multiply(Matrix.Shear(this.elements.length, x, y));
};