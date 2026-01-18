import { Controller, Get, Post, Query, Req, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { catchError, EMPTY, lastValueFrom } from 'rxjs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { parse } from 'csv-parse/sync';

export class Negocio {
  compra_venda:string;
  id:string;
  magic_number:string;
  posicao_id:string;
  data:string;
  data_termino:string;
  lucro:number;
  pontos:number;
  contratos:number;
}

@Controller()
export class AppController {
  constructor(
    private readonly _appService: AppService,
    private readonly _httpService: HttpService
  ) {}

  @Get()
  getHello(): string {
    return this._appService.getHello();
  }

  @Get('call-get')
  async getExecute(@Req() request) {
    let url = request.headers.url;
    let query = '';
    for(const prop in request.query??{}){
      if(query == ''){
        query = '?';
      }
      query += `${query == ''?'?':'&'}${prop}=${request.query[prop]}`;
    }
    if(query){
      url = `${url}${query}`;
    }

    return (await lastValueFrom(this._httpService.get(url).pipe(catchError(e => {
      return EMPTY;
    })))).data;
  }

  batchArray<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  @Post('negocios/update')
  @UseInterceptors(FileInterceptor('negocios'))
  async negociosUpdate(@Req() request, @UploadedFile() file: Express.Multer.File) {
    let url = `${request.headers.url}/rest/v1/negocios?on_conflict=id`;
    let token = request.headers.token;

    if(!file){
      return;
    }

    const buf: Buffer = file.buffer;

    let text: string;
    if (buf[0] === 0xFF && buf[1] === 0xFE) {
      // UTF-16 LE BOM
      text = buf.toString('utf16le');
    } else if (buf[0] === 0xFE && buf[1] === 0xFF) {
      // UTF-16 BE BOM - Node não tem decode 'utf16be', converter manualmente:
      // inverter pares de bytes e decodificar como utf16le
      const swapped = Buffer.alloc(buf.length - 2);
      for (let i = 2; i < buf.length; i += 2) {
        swapped[i-2] = buf[i+1];
        swapped[i-1] = buf[i];
      }
      text = swapped.toString('utf16le');
    } else {
      // fallback: tentar utf8, se vier com nulls tenta utf16le
      text = buf.toString('utf8');
      if (text.includes('\u0000')) text = buf.toString('utf16le');
    }

    // limpeza básica (remover caracteres de controle indesejados)
    text = text
      .replace(/\uFEFF/g, '')              // BOM se sobrar
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]+/g, '') // remove controles exceto newline
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n');    

    let data:Negocio[] = [];
    const records = parse(text.replace(/\r/g, '')
        .replace(/\t/g, '')
        .replace(/\s*;\s*/g, ';'), {
      delimiter: ';',
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true 
    });    

    records.forEach((tmp, index) => {
        if(index == 0){
          return;
        }

        let negocio = new Negocio();
        negocio.id = tmp[0];
        negocio.compra_venda = tmp[1];
        negocio.magic_number = tmp[2];
        negocio.posicao_id = tmp[3];
        negocio.data = tmp[4];
        negocio.data_termino = tmp[5];
        negocio.lucro = parseFloat(tmp[6]);
        negocio.contratos = parseFloat(tmp[7]);
        negocio.pontos = parseFloat(tmp[8]);

        if(!data.find(x => x.id == negocio.id)){
          data.push(negocio);
        }
    });

    this.batchArray(data, 30).forEach(async data => {
      return (await lastValueFrom(this._httpService.post(url, data, {
        headers : {
          'apikey': token,
          'Authorization': `Bearer ${token}`,
          "Prefer": "resolution=merge-duplicates" 
        }
      })));
    });
  }  
}

