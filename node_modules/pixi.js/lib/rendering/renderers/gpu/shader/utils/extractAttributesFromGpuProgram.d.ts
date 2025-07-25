import type { ExtractedAttributeData } from '../../../gl/shader/program/extractAttributesFromGlProgram';
import type { ProgramSource } from '../GpuProgram';
/**
 * @param root0
 * @param root0.source
 * @param root0.entryPoint
 * @internal
 */
export declare function extractAttributesFromGpuProgram({ source, entryPoint }: ProgramSource): Record<string, ExtractedAttributeData>;
