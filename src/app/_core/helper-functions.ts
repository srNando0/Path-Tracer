/*
	Shaders
*/
export function createShader(
	gl: WebGL2RenderingContext,
	type: GLenum,
	source: string
): WebGLShader | null {
	const shader: WebGLShader | null = gl.createShader(type);
	if (!shader) {
		console.error("Couldn't create shader!");
		return null;
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		return shader;

	console.error("Couldn't compile shader!");
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
	return null;
}



/*
	Fetching data
*/
// Used by SWR Hook to fetch data
export const textFetcher = async (key: string): Promise<any> => {
	const res = await fetch(key);
	const data = await res.text();
	return data;
}