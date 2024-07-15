'use client'	// this is to allow client-side fetching
import useSWR from 'swr';

import { useState, useEffect, useRef } from "react";
import { ReactNode, RefObject, MutableRefObject } from "react";
// use MutableRefObject for mutable variables

import { textFetcher } from "./_core/helper-functions";
import { PathTracer, DrawInfo, NullError } from "./_core/path-tracer";



/*
	React Component
*/
const Home = (): ReactNode => {
	// Canvas attributes
	const webglCanvasRef: RefObject<HTMLCanvasElement> = useRef<HTMLCanvasElement>(null);
	//const [canvasResolution, setCanvasResolution] = useState({x: 300, y: 150});
	const canvasResolution = {x: 2*192, y: 2*108};

	// Fetching shaders
	const vertexShaderResponse = useSWR<string>("/shaders/vertex.glsl", textFetcher);
	const fragmentShaderResponse = useSWR<string>("/shaders/fragment.glsl", textFetcher);
	const postFragmentShaderResponse = useSWR<string>("/shaders/post-fragment.glsl", textFetcher);

	// Creating Shaders
	const vertexShaderSource: string | null = vertexShaderResponse.data ?? null;
	const fragmentShaderSource: string | null = fragmentShaderResponse.data ?? null;
	const postFragmentShaderSource: string | null = postFragmentShaderResponse.data ?? null;

	// Path-Tracer
	//const [pathTracer, setPathTracer] = useState<PathTracer | null>(null);
	let pathTracer: PathTracer | null;
	let mousePosition = {
		x: 0,
		y: 0
	};
	let mouseAngles = {
		x: 0,
		y: Math.PI/2
	};
	let time = 0.0;
	const mouseSensibility = {
		x: 100,
		y: 100,
	};



	// Draw event
	function draw(): void {//time: DOMHighResTimeStamp): void {
		if (!pathTracer)
			throw new NullError("pathTracer is null");

		const drawInfo: DrawInfo = {
			mouse: mouseAngles,
			position: {x: 0.0, y: 0.0, z: 2.0},
			distance: 3.0,
			fov: 75,
			time: time
		};
		pathTracer.draw(drawInfo);

		time += 1.0;
		window.requestAnimationFrame(draw);
	}



	function mouseListener(e: MouseEvent) {
		const delta = {
			x: e.clientX - mousePosition.x,
			y: e.clientY - mousePosition.y
		};
		mousePosition = {
			x: e.clientX,
			y: e.clientY
		};

		if (e.buttons != 1)
			return;

		mouseAngles.x -= delta.x/mouseSensibility.x;
		mouseAngles.y -= delta.y/mouseSensibility.y;

		mouseAngles.x %= 2*Math.PI;
		mouseAngles.y = Math.max(0, Math.min(mouseAngles.y, Math.PI));

		time = 0.0;
	}



	useEffect(() => {
		// Exit if shaders are not loaded yet and the canvas is not loaded yet
		if (vertexShaderSource == null || fragmentShaderSource == null || postFragmentShaderSource == null || webglCanvasRef.current == null)
			return;
		const current = webglCanvasRef.current;

		// resize canvas
		current.width = canvasResolution.x;
		current.height = canvasResolution.y;

		// Create a Path-Tracer
		try {
			pathTracer = new PathTracer(current, vertexShaderSource, fragmentShaderSource, postFragmentShaderSource);
			//setPathTracer(new PathTracer(webglCanvasRef.current, vertexShaderSource, fragmentShaderSource));
			//draw();

			current.addEventListener("mousemove", mouseListener);
			window.requestAnimationFrame(draw);
			return () => {
				current.removeEventListener("mousemove", mouseListener);
			};
		} catch (e: unknown) {
			if (e instanceof Error) {
				console.error(e.name);
				console.log(e.message);
			}
		}
	}, [webglCanvasRef.current, vertexShaderSource, fragmentShaderSource, postFragmentShaderSource]);



	return (
		<>
		<div className = 'p-2 rounded-xl flex justify-center'>
			<canvas ref = {webglCanvasRef} className = "w-5/6" style = {{imageRendering: "pixelated"}}/>
		</div>
		</>
	);
}



export default Home;