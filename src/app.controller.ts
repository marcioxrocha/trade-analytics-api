import { Controller, Get, Query, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';

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
      query += `${prop}=${request.query[prop]}`;
    }
    if(query){
      url = `${url}${query}`;
    }

    let result;
    this._httpService.get(request.url).subscribe(res => {
      result = res.data;
    });
    return result;
  }
}
