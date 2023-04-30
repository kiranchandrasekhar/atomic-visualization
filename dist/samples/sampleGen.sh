for((n = 1; n <=7; n++))
do
    for((l = 0; l <n; l++))
    do
        for((m = -1*l; m <= l; m++))
        do
            python ../sampling/hydrogen.py $n $l $m
        done
    done
done