"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VeactElement_1 = require("./VeactElement");
var Veact;
(function (Veact) {
    function createElement(type, props, ...children) {
        return new VeactElement_1.VeactElement(type, props || null, children);
    }
    Veact.createElement = createElement;
    function render(element, parent) {
        if (parent != null) {
            parent.appendChild(element.render(parent.ownerDocument));
        }
        else {
            document.body.appendChild(element.render(document));
        }
    }
    Veact.render = render;
})(Veact || (Veact = {}));
exports.default = Veact;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmVhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVmVhY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpREFBNEQ7QUFFNUQsSUFBVSxLQUFLLENBV2Q7QUFYRCxXQUFVLEtBQUs7SUFDWCxTQUFnQixhQUFhLENBQUMsSUFBVyxFQUFFLEtBQWlCLEVBQUUsR0FBRyxRQUFnQjtRQUM3RSxPQUFPLElBQUksMkJBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRmUsbUJBQWEsZ0JBRTVCLENBQUE7SUFDRCxTQUFnQixNQUFNLENBQUMsT0FBb0IsRUFBRSxNQUF3QjtRQUNqRSxJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNqQixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQzthQUFNLENBQUM7WUFDSixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztJQUNMLENBQUM7SUFOZSxZQUFNLFNBTXJCLENBQUE7QUFDTCxDQUFDLEVBWFMsS0FBSyxLQUFMLEtBQUssUUFXZDtBQUNELGtCQUFlLEtBQUssQ0FBQyJ9