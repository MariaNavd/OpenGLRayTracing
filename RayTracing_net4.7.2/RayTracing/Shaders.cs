using OpenTK;
using OpenTK.Graphics.OpenGL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RayTracing
{
    internal class Shaders
    {
        private readonly int vertexShader = 0;
        private readonly int fragmentShader = 0;
        private readonly int program = 0;

        public Shaders(string vertexfile, string fragmentfile)
        {
            vertexShader = CreateShader(ShaderType.VertexShader, vertexfile);
            fragmentShader = CreateShader(ShaderType.FragmentShader, fragmentfile);

            program = GL.CreateProgram();
            GL.AttachShader(program, vertexShader);
            GL.AttachShader(program, fragmentShader);

            GL.LinkProgram(program);
            GL.GetProgram(program, GetProgramParameterName.LinkStatus, out var code);
            if (code != (int)All.True)
            {
                var infoLog = GL.GetProgramInfoLog(program);
                throw new Exception($"Error linking shader № {program} \n\n {infoLog}");
            }

            DeleteShader(vertexShader);
            DeleteShader(fragmentShader);
        }

        public void ActivateProgram() => GL.UseProgram(program);

        public void DeactivateProgram() => GL.UseProgram(0);

        public void DeleteProgram() => GL.DeleteProgram(program);

        public int GetAttribProgram(string name) => GL.GetAttribLocation(program, name);

        public int GetUniformsLocation(string name) => GL.GetUniformLocation(program, name);

        private int CreateShader(ShaderType shaderType, string shaderFile)
        {
            int shaderID = GL.CreateShader(shaderType);
            using (System.IO.StreamReader sr = new System.IO.StreamReader(shaderFile))
            {
                GL.ShaderSource(shaderID, sr.ReadToEnd());
            }
            GL.CompileShader(shaderID);

            GL.GetShader(shaderID, ShaderParameter.CompileStatus, out var code);
            if (code != (int)All.True)
            {
                var infoLog = GL.GetShaderInfoLog(shaderID);
                throw new Exception($"Error compiling shader № {shaderID} \n\n {infoLog}");
            }

            return shaderID;
        }

        private void DeleteShader(int shader)
        {
            GL.DetachShader(program, shader);
            GL.DeleteShader(shader);
        }
    }
}
