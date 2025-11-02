import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * AWS S3 Service
 *
 * Provides file upload functionality to AWS S3 buckets with organized folder structure.
 * Handles multiple file types including images and PDFs for document storage.
 *
 * @category AWS
 * @since 1.0.0
 */
class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  /**
   * Initialize S3 service with AWS credentials from environment variables
   *
   * Required environment variables:
   * - AWS_REGION: AWS region for S3 bucket
   * - AWS_ACCESS_KEY_ID: AWS access key
   * - AWS_SECRET_ACCESS_KEY: AWS secret key
   * - AWS_S3_BUCKET_NAME: S3 bucket name
   */
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
  }

  /**
   * Upload a single file to S3 and return the public URL
   *
   * @param file - The multer file object to upload
   * @param folder - The S3 folder path (default: 'uploads')
   * @returns Promise resolving to the public S3 URL
   *
   * @example
   * ```typescript
   * const fileUrl = await s3Service.uploadFile(req.file, 'documents');
   * console.log(fileUrl); // https://bucket.s3.region.amazonaws.com/documents/uuid.pdf
   * ```
   *
   * @throws Error if upload fails
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const uploadParams: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Return the public URL
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload multiple files to S3 concurrently
   *
   * @param files - Array of multer file objects to upload
   * @param folder - The S3 folder path (default: 'uploads')
   * @returns Promise resolving to array of public S3 URLs
   *
   * @example
   * ```typescript
   * const fileUrls = await s3Service.uploadMultipleFiles(req.files, 'documents');
   * console.log(fileUrls); // ['https://bucket.../file1.pdf', 'https://bucket.../file2.jpg']
   * ```
   *
   * @throws Error if any upload fails
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads'
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files to S3:', error);
      throw new Error('Failed to upload files to S3');
    }
  }

  /**
   * Upload Aadhar documents to organized folder structure
   *
   * @param files - Array of Aadhar document files (PDF/Images)
   * @returns Promise resolving to array of S3 URLs
   *
   * @example
   * ```typescript
   * const aadharUrls = await s3Service.uploadAadharDocuments(req.files.aadharFile);
   * ```
   */
  async uploadAadharDocuments(files: Express.Multer.File[]): Promise<string[]> {
    return this.uploadMultipleFiles(files, 'documents/aadhar');
  }

  /**
   * Upload PCC (Police Clearance Certificate) to organized folder structure
   *
   * @param file - PCC certificate file (PDF/Image)
   * @returns Promise resolving to S3 URL
   *
   * @example
   * ```typescript
   * const pccUrl = await s3Service.uploadPCCCertificate(req.files.pccCertificateFile[0]);
   * ```
   */
  async uploadPCCCertificate(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'documents/pcc');
  }

  /**
   * Upload live picture to organized folder structure
   *
   * @param file - Live picture file (Image only)
   * @returns Promise resolving to S3 URL
   *
   * @example
   * ```typescript
   * const livePicUrl = await s3Service.uploadLivePicture(req.files.livePicFile[0]);
   * ```
   */
  async uploadLivePicture(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'images/live-pics');
  }
}

/**
 * Singleton instance of S3Service
 *
 * @example
 * ```typescript
 * import s3Service from '../Service/s3Service';
 *
 * const fileUrl = await s3Service.uploadFile(file, 'uploads');
 * ```
 */
export default new S3Service();
