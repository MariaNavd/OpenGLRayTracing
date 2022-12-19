using System;
using OpenTK;
using OpenTK.Graphics.OpenGL;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Linq;
using System.Runtime.InteropServices.ComTypes;

namespace RayTracing
{
    public partial class Form1 : Form
    {
        Shaders shader;
        Vector3[] vertdata = new Vector3[] {
            new Vector3(-1f, -1f, 0f),
            new Vector3( 1f, -1f, 0f),
            new Vector3( 1f,  1f, 0f),
            new Vector3(-1f,  1f, 0f)
        };

        public Form1()
        {
            InitializeComponent();
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            shader = new Shaders("..\\..\\shaders\\raytracing.vert", "..\\..\\shaders\\raytracing.frag");
            shader.ActivateProgram();
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            glControl1.MakeCurrent();
            GL.Viewport(0, 0, glControl1.ClientSize.Width, glControl1.ClientSize.Height);
            GL.Clear(ClearBufferMask.ColorBufferBit);

            int vbo_position;
            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);

            GL.BufferData<Vector3>(BufferTarget.ArrayBuffer,
                (IntPtr)(vertdata.Length * Vector3.SizeInBytes), vertdata, BufferUsageHint.StaticDraw);

            int VertexArray = shader.GetAttribProgram("vPosition");
            GL.VertexAttribPointer(VertexArray, 3, VertexAttribPointerType.Float, false, 0, 0);
            GL.EnableVertexAttribArray(VertexArray);

            GL.BindVertexArray(vbo_position);

            GL.DrawArrays(PrimitiveType.QuadsExt, 0, 4);
            //shader.DeactivateProgram();

            glControl1.SwapBuffers();
        }
    }
}
