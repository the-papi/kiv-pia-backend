import {MigrationInterface, QueryRunner} from "typeorm";
import {readFileSync} from "fs";

export class Initial1610625641315 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const query = readFileSync("./src/migration/dump.sql", "utf-8");
        await queryRunner.query(query);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
