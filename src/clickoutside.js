const ctx = '@@clickoutsideContext';

export default {
  /*
   @param el 指令所绑定的元素
   @param binding {Object}
   @param vnode vue编译生成的虚拟节点
   */
  bind(el, binding, vnode) {
    const documentHandler = function (e) {
      /* console.log(el);
      console.log(e.target);
      console.log(vnode);
      console.log(binding); */

      if (!vnode.context || el.contains(e.target) || vnode.context.$refs['menu'].$el.contains(e.target)) {
        return false;
      }
      if (binding.expression) {
        vnode.context[el[ctx].methodName](e);
      } else {
        el[ctx].bindingFn(e);
      }
    };
    el[ctx] = {
      documentHandler,
      methodName: binding.expression,
      bindingFn: binding.value
    };
    setTimeout(() => {
      document.addEventListener('click', documentHandler);
    }, 0);
  },
  update(el, binding) {
    el[ctx].methodName = binding.expression;
    el[ctx].bindingFn = binding.value;
  },
  unbind(el) {
    document.removeEventListener('click', el[ctx].documentHandler);
  }
};
