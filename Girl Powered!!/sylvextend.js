//Extend the functionality of Sylvester. If we need faster math, roll your own
//(check http://blog.tojicode.com/2010/06/stupidly-fast-webgl-matricies.html )
//or change Sylvester to 2D

Vector.Angle = function (theta, mod) {
	 return (Vector.create([mod*Math.cos(theta), mod*Math.sin(theta)]))
};
Vector.prototype.getAngle = function () {
	return Math.atan2(this.elements[1], this.elements[0]);
};
Vector.prototype.getX = function () {
 return this.elements[0];
};
Vector.prototype.getY = function () {
 return this.elements[1];
};
Vector.prototype.perp = function () {
	return Vector.create([this.elements[0], -this.elements[1]]);
};
Vector.prototype.toAngle = function (theta) {
 var mod = this.modulus();
 return (Vector.create([mod*Math.cos(theta), mod*Math.sin(theta)]))
};
Vector.prototype.toModulus = function (mod) {
 var theta = this.getAngle();
 return (Vector.create([mod*Math.cos(theta), mod*Math.sin(theta)]))
};

Matrix.Identity = Matrix.I;

//Scale matrix of size n and scale varargs
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

Matrix.Shear = function (n, x, y) {
 var S = Matrix.I(n);
 S[0][1] = y;
 S[1][0] = x;
 return S;
}

Matrix.prototype.scale = function () {
	return this.multiply(Matrix.Scale.apply(null, Array.prototype.arguments));
}

Matrix.prototype.shear = function (x, y) {
	return this.multiply(Matrix.Shear(this.elements.length, x, y));
}