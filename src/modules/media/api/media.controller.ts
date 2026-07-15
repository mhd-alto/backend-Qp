import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { join } from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';

function isValidImageSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // WEBP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

export class ImageUploadResponseDto {
  @ApiProperty() // wait, ApiProperty is not imported, let's make sure we import or don't use decorators if not needed, but ApiProperty is standard. We will import ApiProperty from @nestjs/swagger!
  url!: string;
}

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  @Post('images')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a validated business logo or campaign image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async uploadImage(
    @UploadedFile() file: any, // Express.Multer.File
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'لم يتم تحميل أي ملف.',
          en: 'No file uploaded.',
        },
      });
    }

    // 1. Validate file size (Limit: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت).',
          en: 'File size exceeds the maximum limit (5MB).',
        },
      });
    }

    // 2. Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'صيغة الملف غير مدعومة. الصيغ المسموحة هي JPEG، PNG، WEBP.',
          en: 'Unsupported file type. Allowed formats are JPEG, PNG, WEBP.',
        },
      });
    }

    // 3. Validate buffer signature (Magic Bytes)
    if (!isValidImageSignature(file.buffer)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'توقيع الملف غير صالح. يرجى تحميل صورة حقيقية.',
          en: 'Invalid file signature. Please upload a genuine image.',
        },
      });
    }

    // 4. Generate unique file name
    const fileExt = file.originalname.split('.').pop()?.toLowerCase() || 'png';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'png';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${safeExt}`;

    const uploadDir = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    return {
      url: `/uploads/${filename}`,
    };
  }
}
