import { BadRequestException } from '@nestjs/common';
import { CacheService } from '@utils/services';
import { instanceToPlain } from 'class-transformer';
import { createHash } from 'crypto';
import * as isEmptyObject from 'is-empty-obj';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { DeleteResult, Repository } from 'typeorm';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';

export abstract class BaseService {
  protected sortableColumns: any = ['id'];
  protected defaultSortBy: any = [['id', 'DESC']];
  protected abstract filterableColumns: any;

  constructor(private readonly repository: Repository<any>) {
    // empty
  }

  public async findAllWithCache(
    query: PaginateQuery,
    cache: CacheService,
  ): Promise<Paginated<any>> {
    const keyObj = {
      ...query,
      model: this.repository.metadata.name,
      defaultSortBy: this.defaultSortBy,
      sortableColumns: this.sortableColumns,
      filterableColumns: this.filterableColumns,
    };

    const keyStr = JSON.stringify(keyObj);
    const keyHash = createHash('md5').update(keyStr).digest('hex');

    let result = await cache.getObject(keyHash);

    if (isEmptyObject(result)) {
      result = await this.findAll(query);
      if (result.data.length) {
        cache.setObject(keyHash, result);
      }
    }

    return result;
  }

  public async findAll(
    query: PaginateQuery,
    cache?: boolean,
  ): Promise<Paginated<any>> {
    const queryBuilder = this.prepareQuery(query);

    if (cache) {
      queryBuilder.cache(true);
    }

    return paginate(query, queryBuilder, {
      sortableColumns: this.sortableColumns,
      defaultSortBy: this.defaultSortBy,
      filterableColumns: this.filterableColumns,
    });
  }

  public async findOne(
    conditions: FindConditions<any>,
    options: FindOneOptions<any> = null,
  ): Promise<any> {
    return await this.repository.findOne(conditions, options);
  }

  public async create(dto: object): Promise<any> {
    const instance = this.repository.create(dto);
    return await instance.save();
  }

  public deleteByIds(ids: number[]): Promise<DeleteResult> {
    return this.repository.delete(ids);
  }

  public delete(id: number): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  protected async mapData(instance: any, dto: object) {
    const data = instanceToPlain(dto);

    for (const key in data) {
      instance[key] = data[key];
    }
  }

  private prepareQuery(query) {
    const tableName = this.repository.metadata.tableName;
    let queryBuilder = this.repository.createQueryBuilder(tableName);

    if (query.filter) {
      queryBuilder = this.parseFilter(queryBuilder, query.filter);

      if (isEmptyObject(query.filter)) {
        delete query.filter;
      }
    }

    if (query.withs) {
      queryBuilder = this.parseWiths(queryBuilder, query.withs);
    }

    return queryBuilder;
  }

  private parseWiths(queryBuilder, withs) {
    const tableName = this.repository.metadata.tableName;

    for (const w of withs) {
      queryBuilder.leftJoinAndSelect(`${tableName}.${w}`, w);
    }

    return queryBuilder;
  }

  private parseFilter(queryBuilder, filter) {
    const tableName = this.repository.metadata.tableName;

    for (const column of Object.keys(filter)) {
      const input = filter[column];

      if (typeof input === 'string') {
        const statements = input.split(':');

        const [operator, value] = statements;

        if (operator === '$like') {
          queryBuilder.where(`${tableName}.${column} LIKE :${column}`, {
            [column]: `%${value}%`,
          });
          delete filter[column];
        }
      }
    }

    return queryBuilder;
  }

  protected async uploadImage(fnUpload: any): Promise<string> {
    try {
      return await fnUpload;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  protected async deleteImage(fnDel: any): Promise<boolean> {
    try {
      return await fnDel;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
