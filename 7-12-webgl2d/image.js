  "use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // 设置GLSL程序
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader", "fragment-shader"]);
  // 获取顶点坐标需要绑定的地方
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
  // 获取 uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var textureLocation = gl.getUniformLocation(program, "u_texture");

  // 创建缓冲区
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var positions = [
    -1, -1,
    -1,  1,
     1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // 为纹理坐标创建缓冲区
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  var texcoords = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url, window.location.href)).origin !== window.location.origin) {
      img.crossOrigin = "";
    }
  }

  // 创建一个纹理 { width: w, height: h, texture: tex }
  // 初始化1x1 px像素 图片加载完更新
  function loadImageAndCreateTextureInfo(url) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    // let's assume all images are not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo = {
      width: 1,   // we don't know the size until it loads
      height: 1,
      texture: tex,
    };
    var img = new Image();
    img.addEventListener('load', function() {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      // 调用 texImage2D() 把已经加载的图片图形数据写到纹理
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      render()
    });
    requestCORSIfNotSameOrigin(img, url);
    img.src = url;

    return textureInfo;
  }

  var texInfo = loadImageAndCreateTextureInfo('https://webglfundamentals.org/webgl/resources/leaves.jpg');

  function render(time) {
    time *= 0.001; // convert to seconds
    // 重新设置canvas大小
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // 裁剪像素区
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, texInfo.texture);

    // 使用着色器程序
    gl.useProgram(program);

    // 设置参数，让我们可以绘制任何尺寸的图像
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var matrix = m4.scaling(1, aspect, 1);  //可是试试将aspect 改为0.1看看效果 - -
    matrix = m4.zRotate(matrix, time);
    matrix = m4.scale(matrix, 0.5, 0.5, 1);
    // 设置矩阵
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // 从第0个unit开始获取纹理
    gl.uniform1i(textureLocation, 0);

    // 绘制 (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }
  // requestAnimationFrame(render);

}
main();