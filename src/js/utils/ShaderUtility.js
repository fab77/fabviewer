
import global from '../Global';

class ShaderUtility{

  useProgram(program){
    if(this.lastUsedProgram != program){
      global.gl.useProgram(program);
      this.lastUsedProgram = program;
    }

  }
}

export const shaderUtility = new ShaderUtility();