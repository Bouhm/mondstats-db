import { Command } from 'nestjs-command';

import { Injectable } from '@nestjs/common';



@Injectable()
export class UserSeed {
constructor(
    private readonly abyssBattle: AbyssBattle,
) { }

@Command({ command: 'create:user', describe: 'create a user', autoExit: true })
async create() {
    const user = await this.abyssBattle.create({
        firstName: 'First name',
        lastName: 'Last name',
        mobile: 999999999,
        email: 'test@test.com',
        password: 'foo_b@r',
    });
    console.log(user);
}
}