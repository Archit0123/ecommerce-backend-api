module.exports = (func) => (req, res, next) => {
  Promise.resolve(func(req, res, next)).catch(next);
};
//Basically this removes the need of using try-catch with async await or individual promise handling with .then .catch
//by taking a function as a parameter and wrapping a promise all aroud it.
