"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
let MyRequestService = class MyRequestService {
    constructor(request) {
        this.request = request;
        console.log("MyRequestService c'tor");
    }
    method() {
        // FAILS because `MyIntermediateService` gets a wrong
        // (too early created) instance:
        console.log('within MyRequestService; path: ', this.request.path);
    }
};
MyRequestService = __decorate([
    common_1.Injectable({ scope: common_1.Scope.REQUEST }),
    __param(0, common_1.Inject(core_1.REQUEST)),
    __metadata("design:paramtypes", [Object])
], MyRequestService);
// Explicit setting the scope workarounds the issue: @Injectable({scope: Scope.REQUEST})
let MyIntermediateService = class MyIntermediateService {
    constructor(myRequestService) {
        this.myRequestService = myRequestService;
        console.log("MyIntermediateService c'tor");
    }
    method() { this.myRequestService.method(); }
};
MyIntermediateService = __decorate([
    __param(0, common_1.Inject("MyRequestService")),
    __metadata("design:paramtypes", [MyRequestService])
], MyIntermediateService);
exports.MyIntermediateService = MyIntermediateService;
let MyController = class MyController {
    constructor(
    // @Inject(MyRequestService) readonly myRequestScopeService: MyRequestService,
    myIntermediateService) {
        this.myIntermediateService = myIntermediateService;
        console.log("MyController c'tor");
    }
    op() {
        // this works: this.myRequestScopeService.method();
        this.myIntermediateService.method();
        return { result: "x" };
    }
};
__decorate([
    common_1.Get("Op"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MyController.prototype, "op", null);
MyController = __decorate([
    common_1.Controller("My"),
    __param(0, common_1.Inject(MyIntermediateService)),
    __metadata("design:paramtypes", [MyIntermediateService])
], MyController);
exports.MyController = MyController;
let InfraModule = class InfraModule {
};
InfraModule = __decorate([
    common_1.Module({
        providers: [MyRequestService],
        exports: [MyRequestService],
    })
], InfraModule);
exports.InfraModule = InfraModule;
let ApplicationModule = class ApplicationModule {
};
ApplicationModule = __decorate([
    common_1.Module({
        imports: [
            InfraModule,
        ],
        providers: [
            // When moving `MyRequestService` here it works,
            MyIntermediateService,
        ],
        controllers: [MyController],
    })
], ApplicationModule);
exports.ApplicationModule = ApplicationModule;
//
async function bootstrap() {
    const app = await core_1.NestFactory.create(ApplicationModule, new platform_express_1.ExpressAdapter());
    const port = 4001;
    await app.listen(port);
    console.log(`listening on port ${port}`);
}
bootstrap();
