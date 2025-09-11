"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Veact = void 0;
__exportStar(require("./For"), exports);
var Veact;
(function (Veact) {
    function render(element, parent) {
        if (parent != null) {
            parent.appendChild(element.render(parent.ownerDocument));
        }
        else {
            document.body.appendChild(element.render(document));
        }
    }
    Veact.render = render;
})(Veact || (exports.Veact = Veact = {}));
exports.default = Veact;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmVhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVmVhY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSx3Q0FBc0I7QUFFdEIsSUFBaUIsS0FBSyxDQVFyQjtBQVJELFdBQWlCLEtBQUs7SUFDbEIsU0FBZ0IsTUFBTSxDQUFDLE9BQXlCLEVBQUUsTUFBd0I7UUFDdEUsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7YUFBTSxDQUFDO1lBQ0osUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7SUFDTCxDQUFDO0lBTmUsWUFBTSxTQU1yQixDQUFBO0FBQ0wsQ0FBQyxFQVJnQixLQUFLLHFCQUFMLEtBQUssUUFRckI7QUFDRCxrQkFBZSxLQUFLLENBQUMifQ==