"use client";

import { onAuthStateChanged, signInWithPopup, User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import { auth, googleAuthProvider } from "@/lib/firebase";
import { addUser } from "@/lib/firestore";
import { motion } from "framer-motion";
import Home from "./components/Home";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  const signInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleAuthProvider);
      await addUser({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });
      setUser(user);
    } catch (error) {
      console.error("Error during Google login", error);
    }
  };

  interface GeometricShape {
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: () => void;
  }

  class Line implements GeometricShape {
    private x1: number;
    private y1: number;
    private x2: number = 0;
    private y2: number = 0;
    private angle: number;
    private length: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x1 = Math.random() * canvas.width;
      this.y1 = Math.random() * canvas.height;
      this.angle = Math.random() * Math.PI * 2;
      this.length = Math.random() * 100 + 50;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
      this.updateEndPoint();
    }

    private updateEndPoint() {
      this.x2 = this.x1 + Math.cos(this.angle) * this.length;
      this.y2 = this.y1 + Math.sin(this.angle) * this.length;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.lineTo(this.x2, this.y2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    update() {
      this.angle += this.speed;
      this.updateEndPoint();
    }
  }

  class Triangle implements GeometricShape {
    private x: number;
    private y: number;
    private size: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 30 + 20;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Circle implements GeometricShape {
    private x: number;
    private y: number;
    private radius: number;
    private speedX: number;
    private speedY: number;
    private color: string;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = Math.random() * 20 + 10;
      this.speedX = (Math.random() - 0.5) * 2;
      this.speedY = (Math.random() - 0.5) * 2;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
      this.canvasWidth = canvas.width;
      this.canvasHeight = canvas.height;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0 || this.x > this.canvasWidth) this.speedX *= -1;
      if (this.y < 0 || this.y > this.canvasHeight) this.speedY *= -1;
    }
  }

  class Square implements GeometricShape {
    private x: number;
    private y: number;
    private size: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 30 + 20;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Star implements GeometricShape {
    private x: number;
    private y: number;
    private outerRadius: number;
    private innerRadius: number;
    private points: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.outerRadius = Math.random() * 20 + 15;
      this.innerRadius = this.outerRadius / 2;
      this.points = 5;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      for (let i = 0; i < this.points * 2; i++) {
        const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
        const x = Math.cos((i * Math.PI) / this.points) * radius;
        const y = Math.sin((i * Math.PI) / this.points) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Spiral implements GeometricShape {
    private x: number;
    private y: number;
    private radius: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = Math.random() * 30 + 20;
      this.angle = 0;
      this.speed = (Math.random() - 0.5) * 0.1;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let i = 0; i < 720; i++) {
        const r = (this.radius * i) / 720;
        const x = this.x + r * Math.cos(this.angle + (i * Math.PI) / 180);
        const y = this.y + r * Math.sin(this.angle + (i * Math.PI) / 180);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Hexagon implements GeometricShape {
    private x: number;
    private y: number;
    private size: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 20 + 15;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const x = this.size * Math.cos((i * Math.PI) / 3);
        const y = this.size * Math.sin((i * Math.PI) / 3);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class CrossHatch implements GeometricShape {
    private x: number;
    private y: number;
    private size: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 30 + 20;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-this.size / 2, (i * this.size) / 5);
        ctx.lineTo(this.size / 2, (i * this.size) / 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((i * this.size) / 5, -this.size / 2);
        ctx.lineTo((i * this.size) / 5, this.size / 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Zigzag implements GeometricShape {
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private segments: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.width = Math.random() * 50 + 30;
      this.height = Math.random() * 30 + 20;
      this.segments = 5;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      for (let i = 0; i <= this.segments; i++) {
        const x = (i / this.segments) * this.width;
        const y = (i % 2 === 0 ? 0 : 1) * this.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Flower implements GeometricShape {
    private x: number;
    private y: number;
    private radius: number;
    private petals: number;
    private angle: number;
    private speed: number;
    private color: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = Math.random() * 20 + 15;
      this.petals = Math.floor(Math.random() * 5) + 5;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() - 0.5) * 0.02;
      this.color = `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.5)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      for (let i = 0; i < this.petals * 2; i++) {
        const angle = (i * Math.PI) / this.petals;
        const x = Math.cos(angle) * this.radius;
        const y = Math.sin(angle) * this.radius;
        if (i % 2 === 0) ctx.moveTo(x, y);
        else ctx.quadraticCurveTo(0, 0, x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    update() {
      this.angle += this.speed;
    }
  }

  class Fractal implements GeometricShape {
    private x: number;
    private y: number;
    private size: number;
    private angle: number;
    private depth: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 50 + 30;
      this.angle = Math.random() * Math.PI * 2;
      this.depth = Math.floor(Math.random() * 3) + 3;
    }

    draw(ctx: CanvasRenderingContext2D) {
      this.drawFractal(ctx, this.x, this.y, this.size, this.angle, this.depth);
    }

    private drawFractal(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      depth: number
    ) {
      if (depth === 0) return;

      const x1 = x + Math.cos(angle) * size;
      const y1 = y + Math.sin(angle) * size;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      this.drawFractal(ctx, x1, y1, size * 0.7, angle - Math.PI / 4, depth - 1);
      this.drawFractal(ctx, x1, y1, size * 0.7, angle + Math.PI / 4, depth - 1);
    }

    update() {
      // フラクタルは静的なので更新は不要
    }
  }

  class Polygon implements GeometricShape {
    private x: number;
    private y: number;
    private radius: number;
    private sides: number;
    private angle: number;
    private rotationSpeed: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = Math.random() * 30 + 20;
      this.sides = Math.floor(Math.random() * 5) + 5;
      this.angle = 0;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let i = 0; i < this.sides; i++) {
        const angle = (i / this.sides) * Math.PI * 2 + this.angle;
        const x = this.x + Math.cos(angle) * this.radius;
        const y = this.y + Math.sin(angle) * this.radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.stroke();
    }

    update() {
      this.angle += this.rotationSpeed;
    }
  }

  class Lissajous implements GeometricShape {
    private x: number;
    private y: number;
    private a: number;
    private b: number;
    private delta: number;
    private size: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.a = Math.floor(Math.random() * 5) + 1;
      this.b = Math.floor(Math.random() * 5) + 1;
      this.delta = Math.random() * Math.PI * 2;
      this.size = Math.random() * 50 + 30;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 2; t += 0.01) {
        const x = this.x + Math.sin(this.a * t + this.delta) * this.size;
        const y = this.y + Math.sin(this.b * t) * this.size;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
    update() {
      this.delta += 0.01;
    }
  }

  class Epicycloid implements GeometricShape {
    private x: number;
    private y: number;
    private R: number;
    private r: number;
    private d: number;
    private angle: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.R = Math.random() * 30 + 20;
      this.r = Math.random() * 10 + 5;
      this.d = Math.random() * 10 + 5;
      this.angle = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const x =
          this.x +
          (this.R + this.r) * Math.cos(t) -
          this.d * Math.cos(((this.R + this.r) / this.r) * t);
        const y =
          this.y +
          (this.R + this.r) * Math.sin(t) -
          this.d * Math.sin(((this.R + this.r) / this.r) * t);
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    update() {
      this.angle += 0.01;
    }
  }

  class Hypocycloid implements GeometricShape {
    private x: number;
    private y: number;
    private R: number;
    private r: number;
    private d: number;
    private angle: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.R = Math.random() * 50 + 30;
      this.r = Math.random() * 20 + 10;
      this.d = Math.random() * 10 + 5;
      this.angle = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const x =
          this.x +
          (this.R - this.r) * Math.cos(t) +
          this.d * Math.cos(((this.R - this.r) / this.r) * t);
        const y =
          this.y +
          (this.R - this.r) * Math.sin(t) -
          this.d * Math.sin(((this.R - this.r) / this.r) * t);
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    update() {
      this.angle += 0.01;
    }
  }
  class Rhodonea implements GeometricShape {
    private x: number;
    private y: number;
    private size: number;
    private k: number;
    private angle: number;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 50 + 30;
      this.k = Math.floor(Math.random() * 5) + 2;
      this.angle = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const r = this.size * Math.cos(this.k * t);
        const x = this.x + r * Math.cos(t);
        const y = this.y + r * Math.sin(t);
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    update() {
      this.angle += 0.01;
    }
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D; //Fixed: Added type assertion
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const text = "AI Record";

    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;

    const startX = (canvas.width - textWidth) / 2;
    const startY = canvas.height / 2;

    const path = new Path2D();
    path.moveTo(startX, startY);
    path.lineTo(startX + textWidth, startY);

    // 幾何学的な図形を生成
    const shapes: GeometricShape[] = [];
    for (let i = 0; i < 10; i++) {
      shapes.push(new Circle(canvas));
    }
    for (let i = 0; i < 5; i++) {
      shapes.push(new Line(canvas));
      shapes.push(new Triangle(canvas));
      shapes.push(new Square(canvas));
      shapes.push(new Star(canvas));
      shapes.push(new Spiral(canvas));
      shapes.push(new Hexagon(canvas));
      shapes.push(new CrossHatch(canvas));
      shapes.push(new Zigzag(canvas));
      shapes.push(new Flower(canvas));
      shapes.push(new Fractal(canvas));
      shapes.push(new Polygon(canvas));
      shapes.push(new Lissajous(canvas));
      shapes.push(new Epicycloid(canvas));
      shapes.push(new Hypocycloid(canvas));
      shapes.push(new Rhodonea(canvas));
    }

    const animate = (progress: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景の幾何学的な図形を描画
      shapes.forEach((shape) => {
        shape.draw(ctx);
        shape.update();
      });

      if (progress < 0.5) {
        // Line to text
        const dashLength = textWidth * (progress * 2);
        ctx.setLineDash([dashLength, textWidth - dashLength]);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke(path);

        ctx.setLineDash([]);
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
      } else {
        // Text to line
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

        const dashLength = textWidth * ((1 - progress) * 2);
        ctx.setLineDash([dashLength, textWidth - dashLength]);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke(path);
      }
    };

    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / 3000; // 3 seconds animation
      const normalizedProgress = progress % 1;

      animate(normalizedProgress);

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);

    // ウィンドウサイズが変更されたときにキャンバスサイズを調整
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full h-screen flex items-center justify-center bg-gray-100"
      >
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute">
          <button
            className="text-xl mt-32 text-black font-semibold border-1 rounded-4xl border-black px-4 py-1 cursor-pointer"
            onClick={signInWithGoogle}
          >
            登録はこちら
          </button>
        </div>

        <div className="absolute mt-56">
          <p className="text-sm text-black font-medium ">
            AIがPC画面を記録して日記を作成
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <main className="h-screen">
      <Home uid={user.uid} />
    </main>
  );
}
