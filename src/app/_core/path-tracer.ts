/*
	Interfaces
*/
export interface DrawInfo {
	mouse: {
		x: number,
		y: number
	},
	position: {
		x: number,
		y: number,
		z: number
	},
	distance: number,
	fov: number,
	time: number
	//deltaTime: number
}



/*
	Error classes
*/
export class NullError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "NullError";
	}
}

export class WebGLCompilationError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "WebGLCompilationError";
	}
}

export class WebGLLinkError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "WebGLLinkError";
	}
}



/*
	Main class
*/
export class PathTracer {
	/*
		Atributes
	*/
	private gl: WebGL2RenderingContext;

	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	private program: WebGLProgram;

	private postFragmentShader: WebGLShader;
	private postProgram: WebGLProgram

	private vao: WebGLVertexArrayObject;

	private currentTexture: 0 | 1;
	private texture0: WebGLTexture;
	private texture1: WebGLTexture;
	private fbo: WebGLFramebuffer;

	private uResolution: WebGLUniformLocation;
	private uFovTangent: WebGLUniformLocation;
	private uCameraPosition: WebGLUniformLocation;
	private uViewMatrix: WebGLUniformLocation;
	private uTime: WebGLUniformLocation;



	/*
		Auxiliary Methods
	*/
	private createShader(type: GLenum, source: string): WebGLShader {
		const shader: WebGLShader | null = this.gl.createShader(type);

		// Throw error if shader is null
		if (!shader)
			throw new NullError("Couldn't create shader");

		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		// Check if shader has been compiled correctly
		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
			return shader;

		// Throw error if shader couldn't be compiled
		const message: string = this.gl.getShaderInfoLog(shader) ?? "No shader info log available";
		this.gl.deleteShader(shader);
		throw new WebGLCompilationError(message);
	}



	private createProgram(shaders: WebGLShader[]): WebGLProgram {
		const program: WebGLProgram | null = this.gl.createProgram();

		// Throw error if program is null
		if (!program)
			throw new NullError("Couldn't create program");

		for (let shader of shaders)
			this.gl.attachShader(program, shader);
		this.gl.linkProgram(program);

		// Check if program has been linked
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) 
			return program;

		// Throw error if program couldn't be linked
		const message: string = this.gl.getProgramInfoLog(program) ?? "No program info log available";
		this.gl.deleteProgram(program);
		throw new WebGLLinkError(message);
	}



	private createCamera(phi: number, theta: number): number[] {
		const sinTheta = Math.sin(theta);
		const cosTheta = Math.cos(theta);
		const sinPhi = Math.sin(phi);
		const cosPhi = Math.cos(phi);
	
		const right = {
			x: -sinPhi,
			y: cosPhi,
			z: 0.0
		};
		const up = {
			x: -cosTheta*cosPhi,
			y: -cosTheta*sinPhi,
			z: sinTheta
		};
		const front = {
			x: sinTheta*cosPhi,
			y: sinTheta*sinPhi,
			z: cosTheta
		};
		
		return [
			right.x, right.y, right.z,
			up.x, up.y, up.z,
			front.x, front.y, front.z
		];
	}



	private config(resolution: {x: number, y: number}): void {
		const gl = this.gl;

		// Creating the position buffer
		const positionBuffer: WebGLBuffer | null = gl.createBuffer();
		if (!positionBuffer)
			throw new NullError("Couldn't create the position buffer");

		// Writing data on position buffer
		const positions = [
			-1, -1,
			1, -1,
			-1, 1,
			1, 1
		];
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		// Getting locations
		const positionAttributeLocation: GLint = gl.getAttribLocation(this.program, "pos");

		// Configuring the VAO
		gl.bindVertexArray(this.vao);
		gl.enableVertexAttribArray(positionAttributeLocation);
		const vaoConfig = {
			size: 2,
			type: gl.FLOAT,
			normalize: false,
			stride: 0,
			offset: 0
		}
		gl.vertexAttribPointer(
			positionAttributeLocation,
			vaoConfig.size,
			vaoConfig.type,
			vaoConfig.normalize,
			vaoConfig.stride,
			vaoConfig.offset
		);

		// Configuring the textures and the FBO
		gl.bindTexture(gl.TEXTURE_2D, this.texture0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, resolution.x, resolution.y);
		gl.bindTexture(gl.TEXTURE_2D, this.texture1);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, resolution.x, resolution.y);

		// Pre-draw configuration
		gl.bindVertexArray(this.vao);
		gl.useProgram(this.program);
		gl.uniform2f(this.uResolution, resolution.x, resolution.y);
	}



	public draw(info: DrawInfo): void {
		const gl = this.gl;
		const drawConfig = {
			primitiveType: gl.TRIANGLE_STRIP,
			offset: 0,
			count: 4
		};

		const fovTangent = Math.tan((Math.PI/360)*info.fov);
		const viewMatrix = this.createCamera(info.mouse.x, info.mouse.y);

		// FBO drawing
		gl.useProgram(this.program);

		gl.uniform1f(this.uFovTangent, fovTangent);
		gl.uniform3f(this.uCameraPosition,
			info.position.x + info.distance*viewMatrix[6],
			info.position.y + info.distance*viewMatrix[7],
			info.position.z + info.distance*viewMatrix[8]);
		gl.uniformMatrix3fv(this.uViewMatrix, false, viewMatrix);
		gl.uniform1ui(this.uTime, info.time);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		if (this.currentTexture == 0) {
			gl.bindTexture(gl.TEXTURE_2D, this.texture0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0);
			this.currentTexture = 1;
		} else {
			gl.bindTexture(gl.TEXTURE_2D, this.texture1);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture0, 0);
			this.currentTexture = 0;
		}
		gl.drawArrays(drawConfig.primitiveType, drawConfig.offset, drawConfig.count);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Output drawing
		gl.useProgram(this.postProgram);
		if (this.currentTexture == 0)
			gl.bindTexture(gl.TEXTURE_2D, this.texture0);
		else
			gl.bindTexture(gl.TEXTURE_2D, this.texture1);
		gl.drawArrays(drawConfig.primitiveType, drawConfig.offset, drawConfig.count);
	}



	/*
		Constructor
	*/
	public constructor(
		webglCanvas: HTMLCanvasElement,
		vertexShaderSource: string,
		fragmentShaderSource: string,
		postFragmentShaderSource: string
	) {
		// Get WebGL context
		const gl: WebGL2RenderingContext | null = webglCanvas.getContext("webgl2");
		if (!gl)
			throw new NullError("WebGL2 is not supported");
		else
			this.gl = gl;

		// Creating shaders
		this.vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
		this.fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
		this.postFragmentShader = this.createShader(gl.FRAGMENT_SHADER, postFragmentShaderSource);

		// Creating the program
		this.program = this.createProgram([
			this.vertexShader,
			this.fragmentShader
		]);
		this.postProgram = this.createProgram([
			this.vertexShader,
			this.postFragmentShader
		]);

		// Creating the VAO
		const vao: WebGLVertexArrayObject | null = gl.createVertexArray();
		if (!vao)
			throw new NullError("Couldn't create VAO");
		this.vao = vao;

		// Creating the textures and the FBO
		this.currentTexture = 0;
		const texture0: WebGLTexture | null = gl.createTexture();
		const texture1: WebGLTexture | null = gl.createTexture();
		const fbo: WebGLFramebuffer | null = gl.createFramebuffer();
		if (!texture0)
			throw new NullError("Couldn't create texture0");
		if (!texture1)
			throw new NullError("Couldn't create texture1");
		if (!fbo)
			throw new NullError("Couldn't create fbo");
		this.texture0 = texture0;
		this.texture1 = texture1;
		this.fbo = fbo;



		// Creating uniforms
		const uResolution: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "uResolution");
		const uFovTangent: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "uFovTangent");
		const uCameraPosition: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "uCameraPosition");
		const uViewMatrix: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "uViewMatrix");
		const uTime: WebGLUniformLocation | null = gl.getUniformLocation(this.program, "uTime");
		if (!uResolution)
			throw new NullError("Couldn't find uResolution uniform");
		if (!uFovTangent)
			throw new NullError("Couldn't find uFovTangent uniform");
		if (!uCameraPosition)
			throw new NullError("Couldn't find uCameraPosition uniform");
		if (!uViewMatrix)
			throw new NullError("Couldn't find uViewMatrix uniform");
		if (!uTime)
			throw new NullError("Couldn't find uMTime uniform");
		this.uResolution = uResolution;
		this.uFovTangent = uFovTangent;
		this.uCameraPosition = uCameraPosition;
		this.uViewMatrix = uViewMatrix;
		this.uTime = uTime;



		// Configurating
		this.config({
			x: webglCanvas.width,
			y: webglCanvas.height
		});
	}
}