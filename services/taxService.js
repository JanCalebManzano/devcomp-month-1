module.exports = (reqParams) => {

    const input = {
        monthlySalary: parseFloat(reqParams.monthlySalary, 10),
        year: parseInt(reqParams.year, 10)
    }

    return {
        getData: function() {
            const contriSSS = this.computeSSS();
            const contriPhilhealth = this.computePhilHealth();
            const contriPagibig = this.computePagibig();

            return {
                monthlyWithholdingTax: this.computeMonthlyWithholdingTax(contriSSS.part.employee, contriPhilhealth.part.employee, contriPagibig.part.employee),
                totalYearlyIncomeTax: this.computeTotalYearlyIncomeTax(),
                sss: contriSSS,
                philhealth: contriPhilhealth,
                pagibig: contriPagibig,
                thirteenthMonthPayTax: this.computeThirteenthMonthPayTax()
            }
        },

        computeSSS: function() {
            const salaryCredit = this.getSalaryCredit(input.monthlySalary);

            return {
                whole: salaryCredit * 0.11,
                part: {
                    employee: Math.round(salaryCredit * (0.036 + 3 / 9000) * 10) / 10,
                    employer: Math.round(salaryCredit * (0.073 + 6 / 9000) * 10) / 10
                }
            };
        },

        computePhilHealth: function() {
            const philhealth = require('../configs/philhealthTable');
            const year = (input.year < 2019) ? 2019 :
                (input.year > 2024) ? 2024 : input.year;
            const salary = (input.monthlySalary <= 10000) ? 10000 :
                (input.monthlySalary > philhealth[input.year].maxSalary) ? philhealth[input.year].maxSalary : input.monthlySalary;
            const contribution = salary * philhealth[year].rate;

            return {
                whole: contribution,
                part: {
                    employee: contribution / 2,
                    employer: contribution / 2
                }
            }
        },

        computePagibig: function() {
            const percentage = input.monthlySalary == 1500 ? 0.02 : 0.01;
            const mandatory = input.monthlySalary * percentage;
            const contribution = input.monthlySalary > 1500 ? 100 : mandatory;
            const employer_contribution = input.monthlySalary * 0.02;

            return {
                whole: contribution + employer_contribution,
                part: {
                    employee: contribution,
                    employer: employer_contribution
                }
            };
        },

        computeMonthlyWithholdingTax: function(contriSSS, contriPhilhealth, contriPagibig) {
            const taxableIncome = input.monthlySalary - (contriSSS + contriPhilhealth + contriPagibig);
            const taxCategory = this.getWithholdingTaxCategory(input.year, taxableIncome);
            return taxCategory.exemption + taxCategory.excessRate * (input.monthlySalary - taxCategory.minSalary);
        },

        computeTotalYearlyIncomeTax: function() {
            return 0;
        },

        computeThirteenthMonthPayTax: function() {
            return 0;
        },

        getWithholdingTaxCategory: function(year, salary) {
            const yearCategories = require("../configs/withholdingTaxTable");
            const yearCategory = yearCategories.find((category) => {
                if (category.minYear === null && year <= category.maxYear) {
                    return category;
                } else if (category.maxYear === null && year >= category.minYear) {
                    return category;
                } else if (year >= category.minYear && year <= category.maxYear) {
                    return category;
                }
            });

            return (yearCategory.categories).find((category) => {
                    if (category.minSalary === null && salary <= category.maxSalary) {
                        return category;
                    } else if (category.maxSalary === null && salary >= category.minSalary) {
                        return category;
                    } else if (salary >= category.minSalary && salary <= category.maxSalary) {
                        return category;
                    }
                    }
                );
        },

        getSalaryCredit: function (salary) {
            salary = (salary >= 15750) ? 15750 : salary;
            return (Math.ceil((salary - 1249.99) / 500) * 500) + 1000;
        }
    }
};
