import math
from scipy.special import sph_harm
from scipy.special import assoc_laguerre
import numpy
import pickle
import json
import sys

#Initialize constants
a = 0.529 * math.pow(10, -10) #bohr radius
maxRadius= 50*a
rDensity = 500
aDensity = 500
n = int(sys.argv[1])
l = int(sys.argv[2])
m = int(sys.argv[3])
eSamples = int(math.pow(10, 5)) 
rStep = maxRadius/rDensity
aStep = math.pi/aDensity
scale = 3/a

def main():
    rPDF = discretizeRadialPDF()
    aPDF = discretizeAngularPDF()
    rCDF = normalize(cdf(rPDF))
    aCDF = normalize(cdf(aPDF))

    buf = sample(rCDF, aCDF)

    file_name = '../samples/' + str(n) + "_" + str(l) + "_"+ str(m) +'.json'
    with open(file_name, 'w') as fp:
        json.dump(buf, fp)


def rPDF(r):
    result = math.pow(2/(n*a), 3)
    result *= (math.factorial(n-l-1))/(2*n*math.factorial(n+l))
    result *= math.exp((-2*r)/(n*a))
    result *= math.pow((2*r)/(n*a), 2*l)
    result *= math.pow(assoc_laguerre((2*r)/(n*a), n-l-1, 2*l+1), 2)

    result *= (r*r) #correction for distribution tranformation
    return result

def aPDF(theta):
    result = numpy.conjugate(sph_harm(m, l, 0, theta)) * sph_harm(m, l, 0, theta)
    result = numpy.real(result)

    result *= (math.sin(theta)) #correction for distribution tranformation

    
    return result

def discretizeRadialPDF():
    result = numpy.zeros(rDensity)
    for i in range(rDensity):
        r = rStep*(i+1)
        result[i] = rPDF(r)
    return result

def discretizeAngularPDF():
    result = numpy.zeros(aDensity)
    for i in range(aDensity):
        angle = aStep*(i+1)
        result[i] = aPDF(angle)
    return result

def cdf(pdf):
    result = numpy.zeros(len(pdf))
    sum = 0
    for i in range(len(pdf)):
        sum += pdf[i]
        result[i] = sum

    return result


def normalize(cdf):
    scale = 1.0/cdf[-1]
    result = numpy.zeros(len(cdf))
    for i in range(len(cdf)):
        result[i] = scale*cdf[i]
    return result


def sample(rCDF, aCDF):
    result = []
    for i in range(eSamples):
        rInd = numpy.searchsorted(rCDF, numpy.random.uniform(0, 1))
        aInd = numpy.searchsorted(aCDF, numpy.random.uniform(0, 1))

        r = rInd*rStep*scale
        theta = aInd*aStep
        phi = numpy.random.uniform(0,2*math.pi)

        x = r * math.sin(theta) * math.cos(phi)
        y = r * math.sin(theta) * math.sin(phi)
        z = r * math.cos(theta)

        result.append(x)
        result.append(y)
        result.append(z)
        result.append(1)
    return result
        
if __name__ == "__main__":
    main()