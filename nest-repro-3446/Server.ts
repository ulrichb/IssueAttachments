import express from "express";
import {NestFactory, REQUEST} from "@nestjs/core";
import {Controller, Get, Inject, Injectable, Module, Scope,} from '@nestjs/common';
import {ExpressAdapter} from "@nestjs/platform-express";

@Injectable({scope: Scope.REQUEST})
class MyRequestService {

    constructor(@Inject(REQUEST) private readonly request: express.Request) {
        console.log("MyRequestService c'tor");
    }

    method() {
        // FAILS because `MyIntermediateService` gets a wrong
        // (too early created) instance:
        console.log('within MyRequestService; path: ', this.request.path);
    }
}

// Explicit setting the scope workarounds the issue: @Injectable({scope: Scope.REQUEST})
export class MyIntermediateService {

    constructor(
        @Inject("MyRequestService") readonly myRequestService: MyRequestService,
    ) {
        console.log("MyIntermediateService c'tor");
    }

    method() { this.myRequestService.method(); }
}

@Controller("My")
export class MyController {

    constructor(
        // @Inject(MyRequestService) readonly myRequestScopeService: MyRequestService,
        @Inject(MyIntermediateService) readonly myIntermediateService:
            MyIntermediateService) {

        console.log("MyController c'tor");
    }

    @Get("Op")
    op() {
        // this works: this.myRequestScopeService.method();
        this.myIntermediateService.method();
        return {result: "x"};
    }
}

@Module({
    providers: [MyRequestService],
    exports: [MyRequestService],
})
export class InfraModule {}

@Module({
    imports: [
        InfraModule,
    ],
    providers: [
        // When moving `MyRequestService` here it works,
        MyIntermediateService,
    ],
    controllers: [MyController],
})
export class ApplicationModule {}

//

async function bootstrap() {
    const app = await NestFactory.create(ApplicationModule, new ExpressAdapter());

    const port = 4001;
    await app.listen(port);
    console.log(`listening on port ${port}`);
}

bootstrap();
